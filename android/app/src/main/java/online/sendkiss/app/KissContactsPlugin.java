package online.sendkiss.app;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(
    name = "KissContacts",
    permissions = {
        @Permission(
            alias = "contacts",
            strings = { Manifest.permission.READ_CONTACTS }
        )
    }
)
public class KissContactsPlugin extends Plugin {

    @PluginMethod
    public void pickContact(PluginCall call) {
        try {
            Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
            startActivityForResult(call, intent, "pickContactResult");
        } catch (Exception e) {
            call.reject("Could not launch contact picker: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void pickContactResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("User cancelled contact picker");
            return;
        }

        Uri contactUri = result.getData().getData();
        if (contactUri == null) {
            call.reject("No contact selected");
            return;
        }

        String[] projection = new String[]{
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI
        };

        try (Cursor cursor = getContext().getContentResolver().query(contactUri, projection, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int photoIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI);

                String name = nameIdx >= 0 ? cursor.getString(nameIdx) : "Someone";
                String tel = numIdx >= 0 ? cursor.getString(numIdx) : "";
                String photo = photoIdx >= 0 ? cursor.getString(photoIdx) : null;

                JSObject res = new JSObject();
                res.put("name", (name != null && !name.trim().isEmpty()) ? name.trim() : "Someone");
                res.put("tel", tel != null ? tel.trim() : "");
                res.put("photo", photo);
                call.resolve(res);
            } else {
                call.reject("Contact not found in cursor");
            }
        } catch (Exception e) {
            call.reject("Failed to read picked contact: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getContacts(PluginCall call) {
        if (getPermissionState("contacts") != PermissionState.GRANTED) {
            requestPermissionForAlias("contacts", call, "contactsPermCallback");
            return;
        }
        queryAndReturnContacts(call);
    }

    @PermissionCallback
    private void contactsPermCallback(PluginCall call) {
        if (getPermissionState("contacts") == PermissionState.GRANTED) {
            queryAndReturnContacts(call);
        } else {
            call.reject("Permission denied to read contacts");
        }
    }

    private void queryAndReturnContacts(PluginCall call) {
        ContentResolver cr = getContext().getContentResolver();
        Uri uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI;
        String[] projection = new String[]{
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI
        };

        JSArray out = new JSArray();
        Set<String> seenNumbers = new HashSet<>();

        try (Cursor cursor = cr.query(uri, projection, null, null, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC")) {
            if (cursor != null) {
                int nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int photoIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI);

                while (cursor.moveToNext()) {
                    String rawNumber = numIdx >= 0 ? cursor.getString(numIdx) : null;
                    if (rawNumber == null || rawNumber.trim().isEmpty()) continue;

                    String normalizedDigits = rawNumber.replaceAll("[^0-9+]", "");
                    if (normalizedDigits.length() < 7 || seenNumbers.contains(normalizedDigits)) continue;
                    seenNumbers.add(normalizedDigits);

                    String name = nameIdx >= 0 ? cursor.getString(nameIdx) : "Someone";
                    String photo = photoIdx >= 0 ? cursor.getString(photoIdx) : null;

                    JSObject contact = new JSObject();
                    contact.put("name", (name != null && !name.trim().isEmpty()) ? name.trim() : "Someone");
                    contact.put("tel", rawNumber.trim());
                    contact.put("photo", photo);
                    out.put(contact);
                }
            }
            JSObject result = new JSObject();
            result.put("contacts", out);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to query contacts: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open settings: " + e.getMessage());
        }
    }
}
