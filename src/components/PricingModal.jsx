import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Check } from "lucide-react";

// packages verisini ana bileşenden alacağız, ancak varsayılan olarak burada tanımlıyoruz.
const packagesData = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      features: [
        "30 video summaries",
        "1 channel tracking",
        "Basic AI summaries",
        "Email support",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      features: [
        "Unlimited summaries",
        "5 channel tracking",
        "Real-time notifications",
        "Detailed analytics",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Premium",
      price: "$39",
      period: "/month",
      features: [
        "Everything in Pro +",
        "Telegram & Email delivery",
        "Custom reports",
        "API access",
        "24/7 priority support",
      ],
      popular: false,
    },
  ];


const PricingModal = ({
  showModal,
  setShowModal,
  isAuthenticated,
  isGuestLoading,
  getGuestToken,
  handleSelectPackage,
  packages = packagesData, // packages prop'unu alıyoruz, gelmezse varsayılanı kullanır
}) => {
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            className="max-w-6xl w-full bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-3xl p-6 md:p-12 shadow-2xl border border-white/10 overflow-y-auto max-h-[90vh]"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="float-right text-gray-400 hover:text-white p-2"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            <div className="text-center mb-8 md:mb-12 pt-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Unlock Unlimited Power
              </h2>
              <p className="mt-3 sm:mt-4 text-lg sm:text-xl text-gray-300">
                Trusted by thousands of users
              </p>

              {/* Free Version Info */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-900/50 border border-yellow-500/50 rounded-lg inline-block">
                <p className="text-base sm:text-lg font-semibold text-yellow-300">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 align-text-bottom" />
                  3 Daily Summaries on Free Plan
                </p>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Free Trial / Guest Plan */}
              <motion.div
                whileHover={{ y: -5 }}
                className="relative rounded-3xl p-6 sm:p-8 border border-green-500 shadow-2xl shadow-green-500/20 bg-white/5 backdrop-blur-xl"
              >
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold">
                    {isAuthenticated ? "Guest Limit" : "Free Trial"}
                  </h3>
                  <div className="mt-4 sm:mt-6">
                    <span className="text-4xl sm:text-5xl font-black">Free</span>
                    <span className="text-gray-400 ml-1">/day</span>
                  </div>
                </div>

                <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-sm sm:text-base">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">3 summaries per day</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Basic AI summaries</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-500 line-through">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500">Channel tracking</span>
                  </li>
                </ul>

                <button
                  onClick={!isAuthenticated ? getGuestToken : () => {}}
                  disabled={isGuestLoading || isAuthenticated}
                  className={`mt-8 sm:mt-10 w-full py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition transform hover:scale-[1.01] shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed ${
                    isAuthenticated
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-400 to-teal-600 text-black"
                  }`}
                >
                  {isGuestLoading ? (
                    <div className="w-5 h-5 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : isAuthenticated ? (
                    "Daily Limit Reached"
                  ) : (
                    "Continue with Free"
                  )}
                </button>
              </motion.div>

              {packagesData.map((pkg) => (
                <motion.div
                  key={pkg.name}
                  whileHover={{ y: -5 }}
                  className={`relative rounded-3xl p-6 sm:p-8 border ${
                    pkg.popular
                      ? "border-cyan-500 shadow-2xl shadow-cyan-500/20"
                      : "border-white/20"
                  } bg-white/5 backdrop-blur-xl`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-purple-600 text-black text-xs sm:text-sm font-bold px-4 py-1.5 sm:px-6 sm:py-2 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold">{pkg.name}</h3>
                    <div className="mt-4 sm:mt-6">
                      <span className="text-4xl sm:text-5xl font-black">
                        {pkg.price}
                      </span>
                      <span className="text-gray-400 ml-1">{pkg.period}</span>
                    </div>
                  </div>

                  <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-sm sm:text-base">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 sm:mt-10">
                    <button
                      onClick={() => handleSelectPackage(pkg.name)}
                      className={`${
                        pkg.popular
                          ? "bg-gradient-to-r from-cyan-400 to-purple-600 text-black shadow-lg"
                          : "bg-white/10 border border-white/30 hover:bg-white/20"
                      } w-full py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition transform hover:scale-[1.01]`}
                    >
                      {pkg.popular ? "Get Started" : "Choose"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PricingModal;