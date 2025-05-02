import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function CoverageMap() {
  const { t } = useTranslation();

  return (
    <section className="py-10 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-4">{t("serving_punjab")}</h2>
              <p className="text-foreground mb-6">{t("serving_punjab_description")}</p>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="material-icon text-primary mr-2">check_circle</span>
                  <span>Amritsar, Ludhiana, Jalandhar</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icon text-primary mr-2">check_circle</span>
                  <span>Patiala, Bathinda, Mohali</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icon text-primary mr-2">check_circle</span>
                  <span>Chandigarh, Pathankot, Hoshiarpur</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icon text-primary mr-2">check_circle</span>
                  <span>{t("and_more_locations")}</span>
                </div>
              </div>
              
              <Button className="mt-6 bg-primary text-white">
                {t("check_availability")}
              </Button>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md">
              <img 
                src="/images/punjab_map.jpg" 
                alt="Punjab Map showing all districts and cities" 
                className="w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
