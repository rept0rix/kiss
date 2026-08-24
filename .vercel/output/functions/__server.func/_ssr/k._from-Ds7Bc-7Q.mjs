import { r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route$1 } from "./router-Dx7h4I9R.mjs";
import { f as isValidPhone, h as phoneDigits, n as CatchScreen, p as loadMe, y as saveMe } from "./me-DOFh6TTP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/k._from-Ds7Bc-7Q.js
var import_jsx_runtime = require_jsx_runtime();
function CatchRoute() {
	const { from } = Route$1.useParams();
	const { p } = Route$1.useSearch();
	const navigate = useNavigate();
	const name = decodeURIComponent(from || "Someone");
	const prev = loadMe();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatchScreen, {
		from: name,
		first: prev.received === 0,
		onCaught: () => {
			const now = loadMe();
			const phone = p && isValidPhone(p) ? phoneDigits(p) : now.phone;
			saveMe({
				...now,
				received: now.received + 1,
				entered: true,
				phone: phone || now.phone
			});
			navigate({
				to: "/",
				search: {},
				replace: true
			});
		}
	});
}
//#endregion
export { CatchRoute as component };
