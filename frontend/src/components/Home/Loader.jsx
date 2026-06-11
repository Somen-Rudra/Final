import { assets } from "../../assets/assets";

export default function Loader() {
 

  return (
    <div className="loader">
      <div className="loader-circle">
        <img src={assets.logo} alt="Logo" className="loader-logo" />
      </div>
    </div>
  );
}
