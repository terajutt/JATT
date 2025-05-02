import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onBookNowClick: () => void;
  onTrackRideClick: () => void;
}

export default function HeroSection({ onBookNowClick, onTrackRideClick }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-primary text-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading font-bold text-3xl md:text-5xl mb-4">{t("hero_title")}</h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">{t("hero_subtitle")}</p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Button 
              onClick={onBookNowClick}
              className="bg-secondary text-primary font-bold py-3 px-8 h-auto text-lg"
            >
              {t("book_now")}
            </Button>
            <Button 
              onClick={onTrackRideClick}
              variant="outline"
              className="bg-white bg-opacity-20 text-white py-3 px-8 h-auto border border-white border-opacity-30 text-lg"
            >
              {t("track_your_ride")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
