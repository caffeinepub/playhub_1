import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import VideosTab from "./pages/VideosTab";
import GamesTab from "./pages/GamesTab";
import AIAssistantTab from "./pages/AIAssistantTab";
import AIVideoStudioTab from "./pages/AIVideoStudioTab";
import Header from "./components/Header";
import Footer from "./components/Footer";
import DailyChallenge from "./components/DailyChallenge";

export default function App() {
  const [activeTab, setActiveTab] = useState("videos");
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-x-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] bg-violet" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[100px] bg-cyan" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[80px] bg-violet" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(oklch(var(--violet)) 1px, transparent 1px), linear-gradient(90deg, oklch(var(--violet)) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-center mb-8">
              <TabsList className="playhub-tabs-list">
                <TabsTrigger value="videos" className="playhub-tab-trigger">
                  <span className="tab-icon">🎬</span>
                  <span>Videos</span>
                </TabsTrigger>
                <TabsTrigger value="games" className="playhub-tab-trigger">
                  <span className="tab-icon">🎮</span>
                  <span>Games</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="playhub-tab-trigger">
                  <span className="tab-icon">✨</span>
                  <span>AI Assistant</span>
                </TabsTrigger>
                <TabsTrigger value="video-studio" className="playhub-tab-trigger">
                  <span className="tab-icon">🎥</span>
                  <span>AI Video Studio</span>
                </TabsTrigger>
                <button
                  type="button"
                  onClick={() => setShowDailyChallenge(true)}
                  className="playhub-tab-trigger flex items-center gap-2 daily-challenge-btn"
                >
                  <span className="tab-icon">🏆</span>
                  <span>Daily Challenge</span>
                </button>
              </TabsList>
            </div>

            <TabsContent value="videos" className="mt-0">
              <VideosTab />
            </TabsContent>
            <TabsContent value="games" className="mt-0">
              <GamesTab />
            </TabsContent>
            <TabsContent value="ai" className="mt-0">
              <AIAssistantTab />
            </TabsContent>
            <TabsContent value="video-studio" className="mt-0">
              <AIVideoStudioTab />
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>

      <DailyChallenge
        open={showDailyChallenge}
        onClose={() => setShowDailyChallenge(false)}
      />

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--violet) / 0.3)",
            color: "oklch(var(--foreground))",
          },
        }}
      />
    </div>
  );
}
