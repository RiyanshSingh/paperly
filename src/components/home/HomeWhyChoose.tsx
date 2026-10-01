import React from 'react';
import { Shield, Zap, Sparkles, UserCheck } from 'lucide-react';

const features = [
  {
    title: "100% Private",
    description: "Every file is processed securely within your own browser. Your sensitive documents are never uploaded to any server.",
    icon: Shield,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    glow: "bg-emerald-500/30"
  },
  {
    title: "Lightning Fast",
    description: "Since there's no uploading or downloading, operations complete almost instantly by utilizing your device's local power.",
    icon: Zap,
    color: "text-amber-400",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    glow: "bg-amber-500/30"
  },
  {
    title: "Completely Free",
    description: "We believe essential tools should be accessible. There are no paywalls, premium tiers, or hidden subscriptions.",
    icon: Sparkles,
    color: "text-fuchsia-400",
    gradient: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent",
    glow: "bg-fuchsia-500/30"
  },
  {
    title: "No Sign-Up",
    description: "No emails, no accounts, no passwords. Just open the tool and start working immediately without any friction.",
    icon: UserCheck,
    color: "text-blue-400",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    glow: "bg-blue-500/30"
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
            We built Paperly to be the PDF tool we always wished existed—fast, secure, and entirely user-first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className={`relative group bg-gradient-to-b ${feature.gradient} border border-zinc-800/60 rounded-[2rem] p-8 overflow-hidden hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full ${feature.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <feature.icon className={`w-10 h-10 ${feature.color} mb-8 stroke-[1.5]`} />
              
              <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
