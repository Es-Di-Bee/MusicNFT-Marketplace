import { render } from "react-dom";
import 'bootstrap/dist/css/bootstrap.css'
import App from './view/App.js';
import * as serviceWorker from './serviceWorker';

render(<App />, document.getElementById("root"));

serviceWorker.unregister();
