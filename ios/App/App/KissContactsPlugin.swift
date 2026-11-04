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

    // Helper: Safely resolve top-most presented view controller
    private func getTopViewController() -> UIViewController? {
        let scenes = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .filter { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }
        let keyWindow = scenes.flatMap { $0.windows }.first(where: { $0.isKeyWindow })
            ?? UIApplication.shared.windows.first(where: { $0.isKeyWindow })
            ?? UIApplication.shared.windows.first
        guard var top = keyWindow?.rootViewController ?? self.bridge?.viewController else {
            return nil
        }
        while let presented = top.presentedViewController, !presented.isBeingDismissed {
            top = presented
        }
        return top
    }

    // Helper: Safely build contact full name without Objective-C exceptions
    private func makeFullName(from contact: CNContact) -> String {
        let given = contact.givenName.trimmingCharacters(in: .whitespaces)
        let family = contact.familyName.trimmingCharacters(in: .whitespaces)
        var name = "\(given) \(family)".trimmingCharacters(in: .whitespaces)
        if name.isEmpty {
            name = contact.organizationName.trimmingCharacters(in: .whitespaces)
        }
        return name.isEmpty ? "Someone" : name
    }

    // MARK: - Native Contact Picker (Zero Permission Prompt Needed by Apple)
    @objc func pickContact(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let topVC = self.getTopViewController() else {
                call.reject("Cannot find view controller to present contacts")
                return
            }
            self.pendingCall = call
            let picker = CNContactPickerViewController()
            picker.delegate = self
            picker.displayedPropertyKeys = [CNContactPhoneNumbersKey]
            picker.predicateForEnablingContact = NSPredicate(format: "phoneNumbers.@count > 0")
            // If contact has 1 phone number, select contact immediately. If multiple, let user pick the number.
            picker.predicateForSelectionOfContact = NSPredicate(format: "phoneNumbers.@count == 1")
            topVC.present(picker, animated: true, completion: nil)
        }
    }

    // Called when a contact is selected directly (e.g. contact has 1 phone number)
    public func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
        guard let call = pendingCall else { return }
        pendingCall = nil

        var tel = ""
        for phone in contact.phoneNumbers {
            let val = phone.value.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
            if !val.isEmpty {
                tel = val
                break
            }
        }

        var photoStr: String? = nil
        if contact.imageDataAvailable, let data = contact.thumbnailImageData ?? contact.imageData {
            if data.count < 80_000 {
                photoStr = "data:image/jpeg;base64," + data.base64EncodedString()
            }
        }

        let fullName = makeFullName(from: contact)
        var res = JSObject()
        res["name"] = fullName
        res["tel"] = tel
        if let photoStr = photoStr {
            res["photo"] = photoStr
        }
        call.resolve(res)
    }

    // Called when a specific phone number is selected from a multi-number contact
    public func contactPicker(_ picker: CNContactPickerViewController, didSelect contactProperty: CNContactProperty) {
        guard let call = pendingCall else { return }
        pendingCall = nil

        let contact = contactProperty.contact
        var tel = ""
        if let phoneVal = contactProperty.value as? CNPhoneNumber {
            tel = phoneVal.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        } else if let first = contact.phoneNumbers.first {
            tel = first.value.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        var photoStr: String? = nil
        if contact.imageDataAvailable, let data = contact.thumbnailImageData ?? contact.imageData {
            if data.count < 80_000 {
                photoStr = "data:image/jpeg;base64," + data.base64EncodedString()
            }
        }

        let fullName = makeFullName(from: contact)
        var res = JSObject()
        res["name"] = fullName
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

        let store = CNContactStore()
        store.requestAccess(for: .contacts) { granted, error in
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

        let store = CNContactStore()
        if status == .notDetermined {
            store.requestAccess(for: .contacts) { [weak self] granted, error in
                DispatchQueue.main.async {
                    if granted {
                        self?.fetchAllContacts(call)
                    } else {
                        call.reject("Permission not granted: \(error?.localizedDescription ?? "denied")")
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
            let keys: [CNKeyDescriptor] = [
                CNContactIdentifierKey as CNKeyDescriptor,
                CNContactGivenNameKey as CNKeyDescriptor,
                CNContactFamilyNameKey as CNKeyDescriptor,
                CNContactOrganizationNameKey as CNKeyDescriptor,
                CNContactPhoneNumbersKey as CNKeyDescriptor
            ]
            let request = CNContactFetchRequest(keysToFetch: keys)
            request.sortOrder = .userDefault

            var list: [JSObject] = []
            var count = 0
            let maxContacts = 3000

            do {
                let freshStore = CNContactStore()
                try freshStore.enumerateContacts(with: request) { contact, stop in
                    if count >= maxContacts {
                        stop.pointee = true
                        return
                    }
                    
                    var phone = ""
                    for p in contact.phoneNumbers {
                        let s = p.value.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !s.isEmpty {
                            phone = s
                            break
                        }
                    }
                    if phone.isEmpty { return }
                    
                    var item = JSObject()
                    let fullName = self.makeFullName(from: contact)
                    item["name"] = fullName
                    item["tel"] = phone
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
                UIApplication.shared.open(url, options: [:]) { success in
                    if success {
                        call.resolve()
                    } else {
                        call.reject("Failed to open settings")
                    }
                }
            } else {
                call.reject("Cannot open settings")
            }
        }
    }
}
