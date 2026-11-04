import Foundation
import Capacitor
import Contacts
import ContactsUI

@objc(KissContactsPlugin)
public class KissContactsPlugin: CAPPlugin, CAPBridgedPlugin, CNContactPickerDelegate {
    public let identifier = "KissContactsPlugin"
    public let jsName = "KissContacts"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pickContact", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getContacts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?
    private let contactStore = CNContactStore()

    // MARK: - Native Contact Picker (Zero Permission Prompt Needed)
    @objc func pickContact(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let vc = self.bridge?.viewController ?? UIApplication.shared.windows.first?.rootViewController else {
                call.reject("Cannot find root view controller")
                return
            }
            self.pendingCall = call
            let picker = CNContactPickerViewController()
            picker.delegate = self
            picker.predicateForEnablingContact = NSPredicate(format: "phoneNumbers.@count > 0")
            vc.present(picker, animated: true, completion: nil)
        }
    }

    public func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
        guard let call = pendingCall else { return }
        pendingCall = nil

        var tel = ""
        if let first = contact.phoneNumbers.first {
            tel = first.value.stringValue
        }

        var photoStr: String? = nil
        if contact.imageDataAvailable, let data = contact.thumbnailImageData ?? contact.imageData {
            // Keep thumbnail compact (< 50KB)
            if data.count < 100_000 {
                photoStr = "data:image/jpeg;base64," + data.base64EncodedString()
            }
        }

        let fullName = CNContactFormatter.string(from: contact, style: .fullName) ?? "\(contact.givenName) \(contact.familyName)".trimmingCharacters(in: .whitespaces)

        var res = JSObject()
        res["name"] = fullName.isEmpty ? "Someone" : fullName
        res["tel"] = tel
        if let photoStr = photoStr {
            res["photo"] = photoStr
        }
        call.resolve(res)
    }

    public func contactPickerDidCancel(_ picker: CNContactPickerViewController) {
        guard let call = pendingCall else { return }
        pendingCall = nil
        call.resolve([:])
    }

    // MARK: - Permission Checking & Requesting
    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        var result = JSObject()
        switch status {
        case .authorized:
            result["readContacts"] = "granted"
        case .denied, .restricted:
            result["readContacts"] = "denied"
        case .notDetermined:
            result["readContacts"] = "prompt"
        @unknown default:
            if #available(iOS 18.0, *), status == .limited {
                result["readContacts"] = "granted"
            } else {
                result["readContacts"] = "denied"
            }
        }
        call.resolve(result)
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        if status == .authorized {
            var result = JSObject()
            result["readContacts"] = "granted"
            call.resolve(result)
            return
        }
        if #available(iOS 18.0, *), status == .limited {
            var result = JSObject()
            result["readContacts"] = "granted"
            call.resolve(result)
            return
        }
        if status == .denied || status == .restricted {
            var result = JSObject()
            result["readContacts"] = "denied"
            call.resolve(result)
            return
        }

        contactStore.requestAccess(for: .contacts) { [weak self] granted, error in
            DispatchQueue.main.async {
                var result = JSObject()
                result["readContacts"] = granted ? "granted" : "denied"
                call.resolve(result)
            }
        }
    }

    // MARK: - Safe Contacts Enumeration
    @objc func getContacts(_ call: CAPPluginCall) {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        var isAuthorized = (status == .authorized)
        if #available(iOS 18.0, *) {
            if status == .limited {
                isAuthorized = true
            }
        }

        if status == .notDetermined {
            contactStore.requestAccess(for: .contacts) { [weak self] granted, error in
                DispatchQueue.main.async {
                    if granted {
                        self?.fetchAllContacts(call)
                    } else {
                        call.reject("Permission not granted")
                    }
                }
            }
        } else if isAuthorized {
            fetchAllContacts(call)
        } else {
            call.reject("Permission denied")
        }
    }

    private func fetchAllContacts(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            // CRITICAL: Do NOT include CNContactNoteKey on iOS as it triggers CNErrorDomain restricted exception
            let keys: [CNKeyDescriptor] = [
                CNContactIdentifierKey as CNKeyDescriptor,
                CNContactGivenNameKey as CNKeyDescriptor,
                CNContactFamilyNameKey as CNKeyDescriptor,
                CNContactPhoneNumbersKey as CNKeyDescriptor,
                CNContactImageDataAvailableKey as CNKeyDescriptor,
                CNContactThumbnailImageDataKey as CNKeyDescriptor
            ]
            let request = CNContactFetchRequest(keysToFetch: keys)
            request.sortOrder = .userDefault

            var list: [JSObject] = []
            var count = 0
            let maxContacts = 1000

            do {
                try self.contactStore.enumerateContacts(with: request) { contact, stop in
                    if count >= maxContacts {
                        stop.pointee = true
                        return
                    }
                    guard let phone = contact.phoneNumbers.first?.value.stringValue, !phone.isEmpty else {
                        return
                    }
                    var item = JSObject()
                    let name = CNContactFormatter.string(from: contact, style: .fullName) ?? "\(contact.givenName) \(contact.familyName)".trimmingCharacters(in: .whitespaces)
                    item["name"] = name.isEmpty ? "Someone" : name
                    item["tel"] = phone
                    // Only attach thumbnail if compact (< 30KB) to prevent WebKit IPC overflow
                    if contact.imageDataAvailable, let data = contact.thumbnailImageData, data.count < 30_000 {
                        item["photo"] = "data:image/jpeg;base64," + data.base64EncodedString()
                    }
                    list.append(item)
                    count += 1
                }
                DispatchQueue.main.async {
                    call.resolve(["contacts": list])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject("Failed to fetch contacts: \(error.localizedDescription)")
                }
            }
        }
    }

    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString), UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url, options: [:]) { _ in
                    call.resolve()
                }
            } else {
                call.reject("Cannot open settings")
            }
        }
    }
}
