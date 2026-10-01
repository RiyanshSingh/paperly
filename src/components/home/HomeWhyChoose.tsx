import React from 'react';
import { Shield, Zap, Sparkles, UserCheck } from 'lucide-react';

const features = [
  {
    title: "100% Private",
    description: "Every file is processed securely within your own browser. Your sensitive documents are never uploaded to any server.",
    icon: Shield,
    iconColor: "text-emerald-400",
    iconContainerClass: "bg-emerald-500/5 border-emerald-500/20",
    gradient: "from-emerald-500/30 via-black to-black",
    glow: "bg-emerald-500"
  },
  {
    title: "Lightning Fast",
    description: "Since there's no uploading or downloading, operations complete almost instantly by utilizing your device's local power.",
    icon: Zap,
    iconColor: "text-amber-400",
    iconContainerClass: "bg-amber-500/5 border-amber-500/20",
    gradient: "from-amber-500/30 via-black to-black",
    glow: "bg-amber-500"
  },
  {
    title: "Completely Free",
    description: "We believe essential tools should be accessible. There are no paywalls, premium tiers, or hidden subscriptions.",
    icon: Sparkles,
    iconColor: "text-fuchsia-400",
    iconContainerClass: "bg-fuchsia-500/5 border-fuchsia-500/20",
    gradient: "from-fuchsia-500/30 via-black to-black",
    glow: "bg-fuchsia-500"
  },
  {
    title: "No Sign-Up",
    description: "No emails, no accounts, no passwords. Just open the tool and start working immediately without any friction.",
    icon: UserCheck,
    iconColor: "text-blue-400",
    iconContainerClass: "bg-blue-500/5 border-blue-500/20",
    gradient: "from-blue-500/30 via-black to-black",
    glow: "bg-blue-500"
  }
];

export const HomeWhyChoose: React.FC = () => {
  return (
    <section className="py-24 px-4 border-t border-zinc-900/50 bg-black relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-zinc-900/50 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Why Choose Paperly?
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            We built Paperly to be the PDF tool we always wished existed: fast, secure, and entirely user-first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className={`relative group bg-gradient-to-b ${feature.gradient} border-t border-x border-zinc-800/40 border-b-0 rounded-[2rem] p-8 overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-2xl`}
            >
              {/* Very soft additional mesh glow at top-left */}
              <div className={`absolute -top-10 -left-10 w-48 h-48 blur-[70px] rounded-full ${feature.glow} opacity-30 z-0`} />
              
              {/* Bottom fade mask to prevent any color bleed at the bottom edge */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-10 border backdrop-blur-md ${feature.iconContainerClass}`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                
                <h3 className="text-3xl font-medium text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
