import React from "react";
import { CalendarCheck, ShieldCheck, Headphones, IndianRupee } from "lucide-react";

export const TrustBenefits: React.FC = () => {
  const benefits = [
    {
      icon: CalendarCheck,
      title: "Flexible Cancellation",
      subtitle: "Cancel & get up to 90% refund",
    },
    {
      icon: IndianRupee,
      title: "Transparent Pricing",
      subtitle: "No hidden charges",
    },
    {
      icon: ShieldCheck,
      title: "Verified Operators",
      subtitle: "Trusted bus partners",
    },
    {
      icon: Headphones,
      title: "24x7 Support",
      subtitle: "Always here to help",
    },
  ];

  return (
    <section className="border-y border-charcoal-border/70 bg-[#F8F4EC] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3.5 group"
              >
                {/* Circular Terracotta / Cream Icon Container */}
                <div className="w-12 h-12 rounded-full bg-white border border-charcoal-border/80 flex items-center justify-center text-terracotta shrink-0 shadow-xs group-hover:border-terracotta group-hover:scale-105 transition-all">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-charcoal leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-charcoal-muted leading-tight">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
