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
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?
    private let contactStore = CNContactStore()

    @objc func pickContact(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let vc = self.bridge?.viewController else {
                call.reject("Cannot find top view controller")
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
            photoStr = "data:image/jpeg;base64," + data.base64EncodedString()
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
        call.reject("User cancelled")
    }

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
            do {
                try self.contactStore.enumerateContacts(with: request) { contact, _ in
                    guard let phone = contact.phoneNumbers.first?.value.stringValue, !phone.isEmpty else {
                        return
                    }
                    var item = JSObject()
                    let name = CNContactFormatter.string(from: contact, style: .fullName) ?? "\(contact.givenName) \(contact.familyName)".trimmingCharacters(in: .whitespaces)
                    item["name"] = name.isEmpty ? "Someone" : name
                    item["tel"] = phone
                    if contact.imageDataAvailable, let data = contact.thumbnailImageData {
                        item["photo"] = "data:image/jpeg;base64," + data.base64EncodedString()
                    }
                    list.append(item)
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
