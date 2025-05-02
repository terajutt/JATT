import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Testimonial {
  id: number;
  name: string;
  rating: number;
  comment: string;
  avatarUrl?: string;
}

export default function Testimonials() {
  const { t } = useTranslation();
  
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span 
        key={i} 
        className="material-icon text-yellow-400 text-sm"
      >
        {i < Math.floor(rating) ? 'star' : i < rating ? 'star_half' : 'star_border'}
      </span>
    ));
  };

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-10">
          {t("customer_testimonials")}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-neutral-100 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : testimonials && testimonials.length > 0 ? (
            testimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-neutral-100 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  {testimonial.avatarUrl ? (
                    <img 
                      src={testimonial.avatarUrl} 
                      alt={testimonial.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                      <span className="material-icon text-primary">person</span>
                    </div>
                  )}
                  <div className="ml-3">
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <div className="flex">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-foreground">"{testimonial.comment}"</p>
              </div>
            ))
          ) : (
            // Default testimonials if no data is available
            <>
              <div className="bg-neutral-100 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="material-icon text-primary">person</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">Rajinder Singh</h4>
                    <div className="flex">
                      {renderStars(5)}
                    </div>
                  </div>
                </div>
                <p className="text-foreground">"Excellent service! Driver was punctual and very professional. The car was clean and comfortable. Will definitely use JATT AIRLINES again."</p>
              </div>
              
              <div className="bg-neutral-100 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="material-icon text-primary">person</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">Simran Kaur</h4>
                    <div className="flex">
                      {renderStars(4.5)}
                    </div>
                  </div>
                </div>
                <p className="text-foreground">"Booking through WhatsApp was so convenient! The driver was friendly and got me to my destination on time despite heavy traffic. Great experience."</p>
              </div>
              
              <div className="bg-neutral-100 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="material-icon text-primary">person</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">Gurpreet Singh</h4>
                    <div className="flex">
                      {renderStars(5)}
                    </div>
                  </div>
                </div>
                <p className="text-foreground">"Used JATT AIRLINES for an emergency trip from Amritsar to Chandigarh. The response was quick and the journey was comfortable. Highly recommended!"</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
