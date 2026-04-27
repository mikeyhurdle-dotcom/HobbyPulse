import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// FAQ data per vertical
// ---------------------------------------------------------------------------

interface FaqItem {
  question: string;
  answer: string;
}

function getFaqs(slug: string, brandName: string): FaqItem[] {
  const shared: FaqItem[] = [
    {
      question: `What is ${brandName}?`,
      answer: `${brandName} is a free content and deals aggregator for hobbyists. We monitor YouTube channels for new content, extract structured data using AI, compare prices across major retailers, and aggregate live streams — all in one place.`,
    },
    {
      question: "How do deals and price comparison work?",
      answer:
        "We scrape prices from multiple retailers several times a day. Each product page shows a price comparison table so you can find the cheapest option. We also detect price drops of 10% or more and can alert you when a product hits your target price.",
    },
    {
      question: "How do price alerts work?",
      answer:
        "On any product page, enter your email and a target price. When the price drops to or below your target, we send you an email with a link to buy. Alerts are checked twice daily (morning and evening).",
    },
    {
      question: "Is this site free?",
      answer:
        "Yes, completely free. We earn a small commission when you buy through our affiliate links — at no extra cost to you. This is how we keep the site running.",
    },
    {
      question: "How often is content updated?",
      answer:
        "YouTube content is checked every few hours. Deals are scraped multiple times a day. Live streams are polled every 5 minutes. Price history is recorded on every scrape.",
    },
    {
      question: "How does the live streams page work?",
      answer:
        "We aggregate live streams from both Twitch and YouTube that match our hobby categories. Streams are polled frequently and marked as offline when they end.",
    },
  ];

  const tabletop: FaqItem[] = [
    {
      question: "What board game content do you cover?",
      answer:
        "We track 20+ board game YouTube channels and automatically classify their videos into reviews, playthroughs, how-to-play guides, top lists, comparisons, and news. You can browse all of this at /boardgames/watch.",
    },
    {
      question: "How does the game directory work?",
      answer:
        "We import data from BoardGameGeek for the top 500 ranked board games — including ratings, player counts, play time, complexity, and more. Each game has its own page with buy links. Use the filters to find games by player count, complexity, or category.",
    },
    {
      question: "What is 'What Should I Play?'",
      answer:
        "It's a quick 4-question quiz that recommends board games based on your group size, preferred complexity, play time, and vibe (competitive, cooperative, party, or strategy). Results link to full game pages with buy links.",
    },
    {
      question: "Which retailers do you compare for board games?",
      answer:
        "We track board game prices on Amazon UK and Zatu Games, plus eBay for second-hand deals. More retailers are being added as affiliate partnerships are approved.",
    },
    {
      question: "Do you also cover miniatures?",
      answer:
        "Yes! We cover Warhammer 40K, Age of Sigmar, The Old World, Kill Team, and more under our Miniatures section. This includes battle reports, army lists, and price comparison across Element Games, Troll Trader, and eBay.",
    },
  ];

  const simracing: FaqItem[] = [
    {
      question: "How does car setup extraction work?",
      answer:
        "When a sim racing creator publishes a setup guide or review, our AI parser extracts the car setup details — sim title, car, track, and key settings. You can browse and filter setups without watching full videos.",
    },
    {
      question: "Which sims do you cover?",
      answer:
        "We cover iRacing, Assetto Corsa Competizione (ACC), Le Mans Ultimate (LMU), F1, and Assetto Corsa. Content is tagged by sim so you can filter easily.",
    },
    {
      question: "What hardware categories do you track deals for?",
      answer:
        "Wheelbases (direct drive and belt-driven), pedals (load cell and potentiometer), steering wheels and rims, rigs and cockpits, monitors, VR headsets, shifters, and handbrakes.",
    },
    {
      question: "Which retailers do you compare?",
      answer:
        "We compare prices from Fanatec, Digital Motorsport, Sim-Lab, Trak Racer, Moza Racing, Simagic, Amazon, and eBay.",
    },
  ];

  return [...shared, ...(slug === "tabletop" ? tabletop : simracing)];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  return {
    title: `FAQ`,
    description: `Frequently asked questions about ${brand.siteName} — how deals, price alerts, content, and live streams work.`,
    openGraph: {
      title: `FAQ | ${brand.siteName}`,
      description: `Frequently asked questions about ${brand.siteName}.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FaqPage() {
  const config = getSiteVertical();
  const brand = getSiteBrand();
  const faqs = getFaqs(config.slug, brand.siteName);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <Nav active="" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground mb-8">
          Everything you need to know about {brand.siteName}.
        </p>

        <Accordion type="multiple" className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </>
  );
}
