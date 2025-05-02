import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-neutral-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center mb-4">
              <span className="font-heading font-bold text-xl text-white">JATT</span>
              <span className="font-heading font-bold text-xl text-secondary ml-1">AIRLINES</span>
            </Link>
            <p className="text-neutral-400 text-sm">{t("footer_description")}</p>
            <div className="mt-4 flex space-x-3">
              <a href="#" className="text-neutral-400 hover:text-white">
                <span className="material-icon">facebook</span>
              </a>
              <a href="https://wa.me/919855884407" className="text-neutral-400 hover:text-white">
                <span className="material-icon">whatsapp</span>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <span className="material-icon">instagram</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">{t("quick_links")}</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-neutral-400 hover:text-white">{t("home")}</Link></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("about_us")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("services")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("driver_signup")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("contact")}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">{t("our_services")}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("local_rides")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("outstation_trips")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("round_trips")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("airport_transfers")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("corporate_services")}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">{t("contact")}</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="material-icon text-neutral-400 mr-2 text-lg">location_on</span>
                <span className="text-neutral-400">SCO 123, Sector 17, Chandigarh, Punjab</span>
              </li>
              <li className="flex items-center">
                <span className="material-icon text-neutral-400 mr-2 text-lg">phone</span>
                <a href="tel:+919855884407" className="text-neutral-400 hover:text-white">+91 9855 884 407</a>
              </li>
              <li className="flex items-center">
                <span className="material-icon text-neutral-400 mr-2 text-lg">whatsapp</span>
                <a href="https://wa.me/919855884407" className="text-neutral-400 hover:text-white">{t("whatsapp_support")}</a>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-neutral-700 my-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">&copy; {new Date().getFullYear()} JATT AIRLINES. {t("all_rights_reserved")}</p>
          <div className="mt-4 md:mt-0 flex items-center">
            <span className="text-neutral-400 text-sm mr-2">{t("service_by")}</span>
            <span className="font-heading font-semibold text-white">SAMVIO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
