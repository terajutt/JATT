import { useTranslation } from "react-i18next";

export default function Features() {
  const { t } = useTranslation();

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-10">
          {t("why_choose_us")}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="material-icon text-primary text-3xl">local_taxi</span>
            </div>
            <h3 className="font-heading font-semibold text-xl mb-2">{t("premium_fleet")}</h3>
            <p className="text-foreground">{t("premium_fleet_description")}</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="material-icon text-primary text-3xl">speed</span>
            </div>
            <h3 className="font-heading font-semibold text-xl mb-2">{t("quick_booking")}</h3>
            <p className="text-foreground">{t("quick_booking_description")}</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="material-icon text-primary text-3xl">support_agent</span>
            </div>
            <h3 className="font-heading font-semibold text-xl mb-2">{t("support_title")}</h3>
            <p className="text-foreground">{t("support_description")}</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <a href="#" className="text-primary font-medium hover:underline inline-flex items-center">
            <span>{t("learn_more")}</span>
            <span className="material-icon ml-1">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>
  );
}
