import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function EmergencyContact() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button 
        onClick={() => setIsPopupVisible(!isPopupVisible)}
        className="bg-red-600 text-white p-4 h-12 w-12 rounded-full shadow-lg hover:bg-red-700 transition-all flex items-center justify-center"
      >
        <span className="material-icon">sos</span>
      </Button>
      
      {isPopupVisible && (
        <div className="bg-white shadow-lg rounded-lg p-4 absolute bottom-16 right-0 w-64">
          <h4 className="font-heading font-bold text-lg mb-2">{t("emergency_contact")}</h4>
          <p className="text-sm text-foreground mb-4">{t("emergency_description")}</p>
          <a 
            href="https://wa.me/919855884407" 
            className="bg-green-500 text-white py-2 px-4 rounded flex items-center justify-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
              alt="WhatsApp" 
              className="h-5 w-5 mr-2"
            />
            <span>{t("whatsapp_support")}</span>
          </a>
        </div>
      )}
    </div>
  );
}
