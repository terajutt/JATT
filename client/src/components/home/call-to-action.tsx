import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface CallToActionProps {
  onBookNowClick: () => void;
  onDriverSignupClick: () => void;
}

export default function CallToAction({ onBookNowClick, onDriverSignupClick }: CallToActionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-10 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-4">
            {t("cta_title")}
          </h2>
          <p className="text-lg opacity-90 mb-8">
            {t("cta_description")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={onBookNowClick}
              className="bg-secondary text-primary font-bold py-3 px-8 h-auto text-lg"
            >
              {t("book_now")}
            </Button>
            <Button 
              onClick={onDriverSignupClick}
              variant="outline"
              className="bg-white bg-opacity-20 text-white py-3 px-8 h-auto border border-white border-opacity-30 text-lg"
            >
              {t("become_driver")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
