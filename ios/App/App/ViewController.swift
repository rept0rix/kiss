import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginType(KissContactsPlugin.self)
        let plugin = KissContactsPlugin()
        bridge?.registerPluginInstance(plugin)
    }
}
