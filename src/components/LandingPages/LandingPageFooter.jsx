import React from "react";
import Image from "../../assets/Image";

export default function LandingPageFooter() {
  return (
    <footer className="w-full mt-12 bg-gradient-to-b from-white/80 via-white/90 to-[#eaf1ff] backdrop-blur-xl border-t border-[rgba(22,38,70,0.08)] shadow-[0_-8px_40px_rgba(32,65,107,0.13)] py-8 md:py-12 relative overflow-hidden">
      {/* Futuristic glowing lines and shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] h-1 bg-gradient-to-r from-orange-400/60 via-blue-400/40 to-green-400/60 blur-lg opacity-60 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-blue-400/10 rounded-full blur-2xl opacity-60" />
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-green-400/10 rounded-full blur-2xl opacity-50" />
      </div>
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 text-center lg:text-left">
        {/* Left: Profile/Logo */}
        <div className="mb-6 lg:mb-0 flex-shrink-0 flex flex-col items-center lg:items-start">
          <div className="bg-gradient-to-br  p-1 rounded-2xl shadow-[0_6px_32px_rgba(255,100,42,0.13)]">
            <img
              src={Image.logo}
              alt="Profile"
              className="w-[80px] h-[100px] sm:w-[100px] sm:h-[120px] md:w-[120px] md:h-[140px] object-cover rounded-xl shadow-[0_4px_24px_rgba(255,100,42,0.13)]"
            />
          </div>
          {/* <span className="mt-3 text-xs text-[#20416b] font-semibold tracking-widest uppercase opacity-70">
            Mark-MyClass
          </span> */}
        </div>
        {/* Center: Socials & Links */}
        <div className="flex-1 flex flex-col items-center lg:items-start">
          <h3 className="text-[#18375F] font-extrabold text-[1.25rem] sm:text-[1.4rem] mb-4 tracking-wider futuristic-glow">
            Connect with us
          </h3>
          <div className="flex gap-5 justify-center lg:justify-start mb-7">
            {[
              {
                icon: <i className="fab fa-facebook-f text-blue-500" />,
                href: "https://facebook.com",
                alt: "Facebook",
                glow: "shadow-[0_0_16px_2px_rgba(59,130,246,0.18)]"
              },
              {
                icon: <i className="fab fa-instagram text-orange-500" />,
                href: "https://instagram.com",
                alt: "Instagram",
                glow: "shadow-[0_0_16px_2px_rgba(255,100,42,0.18)]"
              },
              {
                // Use Twitter icon for X (fa-x-twitter is not in FontAwesome 5)
                icon: <i className="fab fa-twitter text-[#20416b]" />,
                href: "https://x.com",
                alt: "X",
                glow: "shadow-[0_0_16px_2px_rgba(32,65,107,0.18)]",
              },
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl bg-white/80 p-1 transition-all duration-200 hover:bg-gradient-to-tr hover:from-orange-400/20 hover:to-blue-400/20 ${item.glow} ${item.hoverRing}`}
                aria-label={item.alt}
              >
                <span
                  className="flex items-center justify-center w-11 h-11 rounded-xl text-2xl"
                >
                  {item.icon}
                </span>
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-2">
            {["Help", "Contact us", "Support", "Services", "FAQ"].map(
              (label, idx) => (
                <button
                  key={idx}
                  className={`px-5 py-2 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200
                    ${
                      idx % 2 === 0
                        ? "border-2 border-orange-500 text-orange-500 bg-white/90 shadow-[0_2px_8px_rgba(255,100,42,0.08)] hover:bg-orange-500 hover:text-white hover:shadow-[0_4px_16px_rgba(255,100,42,0.18)]"
                        : "text-white bg-gradient-to-tr from-orange-500 via-orange-400 to-blue-400 shadow-[0_2px_12px_rgba(32,65,107,0.10)] hover:from-[#e1581d] hover:to-[#3b82f6] hover:shadow-[0_4px_16px_rgba(32,65,107,0.18)]"
                    }
                    hover:-translate-y-0.5`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
        {/* Right: Ministry/Partner */}
        <div className="mt-8 lg:mt-0 flex-shrink-0 flex flex-col items-center lg:items-end">
          <div className="bg-gradient-to-br from-blue-400/10 via-white/60 to-orange-400/10 p-1 rounded-2xl shadow-[0_6px_32px_rgba(32,65,107,0.10)]">
            <img
              src={Image.image6}
              alt="Ministry of Education"
              className="w-[120px] sm:w-[160px] md:w-[200px] transition-transform duration-300 hover:scale-105 rounded-xl"
            />
          </div>
          <span className="mt-3 text-xs text-[#20416b] font-semibold tracking-widest uppercase opacity-60">
            Ministry of Education
          </span>
        </div>
      </div>
      {/* Futuristic bottom bar */}
      <div className="mt-8 w-full flex justify-center">
        <div className="h-1 w-[60vw] bg-gradient-to-r from-orange-400/60 via-blue-400/40 to-green-400/60 rounded-full blur-[2px] opacity-70" />
      </div>
      <div className="text-center text-xs text-[#18375F]/60 mt-4 font-medium tracking-wide">
        &copy; {new Date().getFullYear()} Mark-MyClass. All rights reserved.
      </div>
    </footer>
  );
}
