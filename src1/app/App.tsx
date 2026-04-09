import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Benefits } from "./components/Benefits";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { LoginModal } from "./components/LoginModal";
import { useState } from "react";

export default function App() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <div className="size-full">
      <Header onLoginClick={() => setLoginModalOpen(true)} />
      <main className="pt-16">
        <Hero onLoginClick={() => setLoginModalOpen(true)} />
        <Features />
        <HowItWorks />
        <Benefits />
        <CTA onLoginClick={() => setLoginModalOpen(true)} />
      </main>
      <Footer />
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}