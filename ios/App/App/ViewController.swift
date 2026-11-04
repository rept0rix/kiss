import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        let plugin = KissContactsPlugin()
        bridge?.registerPluginInstance(plugin)
    }
}
