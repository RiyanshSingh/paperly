import React from "react";
import { Combine, Scissors, FileArchive, FileImage, Image, RotateCw, Trash2, Unlock, PenTool } from "lucide-react";
import { ToolCard } from "../components/ui/ToolCard";

import { SEO } from "../components/SEO";
import { Link } from "react-router-dom";
import { FeatureMerge, FeatureSplit, FeatureCompress, FeatureEdit, FeatureConvert } from "../components/home/HomeSections";
import { HomeFAQ } from "../components/home/HomeFAQ";
import { HomeWhyChoose } from "../components/home/HomeWhyChoose";
import { HomeDirectory } from "../components/home/HomeDirectory";

const tools = [
  {
    title: "Merge PDF",
    description: "Combine Files",
    icon: Combine,
    path: "/merge-pdf",
    gradientClass: "bg-gradient-to-br from-blue-300 to-blue-500",
    tag: "Essential"
  },
  {
    title: "Split PDF",
    description: "Extract Pages",
    icon: Scissors,
    path: "/split-pdf",
    gradientClass: "bg-gradient-to-br from-orange-300 to-amber-500",
    tag: "Popular"
  },
  {
    title: "Compress PDF",
    description: "Reduce Size",
    icon: FileArchive,
    path: "/compress-pdf",
    gradientClass: "bg-gradient-to-br from-purple-300 to-fuchsia-500",
    tag: "Utility"
  },
  {
    title: "PDF to JPG",
    description: "Extract Images",
    icon: FileImage,
    path: "/pdf-to-jpg",
    gradientClass: "bg-gradient-to-br from-emerald-300 to-emerald-500",
    tag: "Convert"
  },
  {
    title: "JPG to PDF",
    description: "Images to PDF",
    icon: Image,
    path: "/jpg-to-pdf",
    gradientClass: "bg-gradient-to-br from-rose-300 to-red-500",
    tag: "Convert"
  },
  {
    title: "Rotate PDF",
    description: "Fix Orientation",
    icon: RotateCw,
    path: "/rotate-pdf",
    gradientClass: "bg-gradient-to-br from-cyan-300 to-cyan-500",
    tag: "Edit"
  },
  {
    title: "Organize PDF",
    description: "Delete & Sort",
    icon: Trash2,
    path: "/delete-pdf-pages",
    gradientClass: "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900",
    tag: "Advanced"
  },
  {
    title: "Unlock PDF",
    description: "Remove Password",
    icon: Unlock,
    path: "/unlock-pdf",
    gradientClass: "bg-gradient-to-br from-indigo-300 to-indigo-500",
    tag: "Security"
  },
  {
    title: "Edit PDF",
    description: "Draw, Text, Annotate",
    icon: PenTool,
    path: "/edit-pdf",
    gradientClass: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600",
    tag: "New"
  },
];

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col w-full bg-black min-h-screen pb-20">
      <SEO 
        title="Merge, Split, Compress & Convert PDF" 
        description="Free online PDF tools to merge, split, compress, and convert your PDF files securely in your browser." 
        path="/"
      />
      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            A Smarter Way to Get More<br />Done With PDFs
          </h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-4xl mx-auto">
            Work with PDFs more efficiently with everything you need in one place. Edit, merge, split, compress, convert, and organize documents through a streamlined experience designed for everyday work.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/merge-pdf" className="px-8 py-3 rounded-full font-medium bg-white text-black hover:bg-zinc-200 transition-colors">
              Get Started
            </Link>
            <a href="#all-tools" className="px-8 py-3 rounded-full font-medium border border-zinc-700 text-white hover:bg-zinc-800 transition-colors">
              Our Tools
            </a>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section id="all-tools" className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-between items-end mb-10 pl-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Our Arsenal</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.path} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Paperly */}
      <HomeWhyChoose />

      {/* Explanatory Sections */}
      <FeatureEdit />
      <FeatureMerge />
      <FeatureSplit />
      <FeatureCompress />
      <FeatureConvert />

      {/* Full Directory */}
      <HomeDirectory />

      {/* FAQ Section */}
      <HomeFAQ />

    </div>
  );
};
