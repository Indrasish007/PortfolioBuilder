import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Terminal, FileText, ArrowRight, Eye, RefreshCw, UploadCloud, ChevronRight, Check } from "lucide-react";
import GlassCard from "./GlassCard.jsx";
import Button from "./Button.jsx";
import Badge from "./Badge.jsx";

const sampleResumes = [
  {
    fileName: "alex_developer_cv.pdf",
    fileSize: "142 KB",
    parsedData: {
      name: "Alex Carter",
      role: "Full Stack Engineer",
      about: "I build responsive, high-performance web applications using React, Node.js, and modern cloud architectures.",
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
      projects: ["NebulaUI", "PromptForge"],
      theme: "bg-slate-950 text-slate-100 dark-theme",
      textColor: "text-cyan-400",
      pillStyle: "bg-cyan-950/50 text-cyan-400 border-cyan-800/60"
    }
  },
  {
    fileName: "sophia_designer_cv.pdf",
    fileSize: "284 KB",
    parsedData: {
      name: "Sophia Martinez",
      role: "Lead UI/UX Designer",
      about: "Creating beautiful, accessible, and user-centric design systems at the intersection of motion and code.",
      skills: ["Figma", "Design Systems", "Prototyping", "WebGL", "CSS"],
      projects: ["Cartograph", "Lumen Notes"],
      theme: "bg-zinc-900 text-zinc-100 designer-theme",
      textColor: "text-rose-400",
      pillStyle: "bg-rose-950/50 text-rose-400 border-rose-800/60"
    }
  },
  {
    fileName: "marcus_pm_cv.pdf",
    fileSize: "189 KB",
    parsedData: {
      name: "Marcus Vance",
      role: "Technical Product Manager",
      about: "Data-driven PM scaling SaaS products, defining system roadmaps, and leading cross-functional teams.",
      skills: ["Roadmapping", "A/B Testing", "SQL", "Agile", "SaaS"],
      projects: ["PayGate", "AnalyticsHub"],
      theme: "bg-neutral-900 text-neutral-100 pm-theme",
      textColor: "text-purple-400",
      pillStyle: "bg-purple-950/50 text-purple-400 border-purple-800/60"
    }
  }
];

export default function GeneratorShowcase() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [animState, setAnimState] = useState("idle"); // idle, uploading, scanning, building, complete
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const animTimeoutRef = useRef([]);

  useEffect(() => {
    // Intersection observer for entrance animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const clearTimeouts = () => {
    animTimeoutRef.current.forEach(t => clearTimeout(t));
    animTimeoutRef.current = [];
  };

  const startGeneration = () => {
    clearTimeouts();
    setAnimState("uploading");
    setUploadProgress(0);
    setLogs(["Uploading resume document..."]);

    // Progress Bar Simulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);

        // Advance to scanning
        const t1 = setTimeout(() => {
          setAnimState("scanning");
          setLogs(prev => [...prev, "Upload complete. Parsing PDF structures..."]);

          const t2 = setTimeout(() => {
            setLogs(prev => [...prev, "Extracting personal identity details...", `Found name: "${sampleResumes[selectedIdx].parsedData.name}"`]);

            const t3 = setTimeout(() => {
              setLogs(prev => [...prev, "Extracting professional experience logs...", "Extracting technical skill sets..."]);

              const t4 = setTimeout(() => {
                setAnimState("building");
                setLogs(prev => [...prev, "Configuring layout grid...", "Styling color themes..."]);

                const t5 = setTimeout(() => {
                  setAnimState("complete");
                  setLogs(prev => [...prev, "Portfolio successfully generated!"]);
                }, 2200);
                animTimeoutRef.current.push(t5);
              }, 1200);
              animTimeoutRef.current.push(t4);
            }, 1000);
            animTimeoutRef.current.push(t3);
          }, 1000);
          animTimeoutRef.current.push(t2);
        }, 500);
        animTimeoutRef.current.push(t1);
      }
    }, 80);
  };

  // Run automatically on component mount and selection change
  useEffect(() => {
    startGeneration();
    return () => clearTimeouts();
  }, [selectedIdx]);

  const activeCV = sampleResumes[selectedIdx];

  return (
    <section id="showcase" className="relative py-24 overflow-hidden border-t border-border/50 bg-background/20">
      <div className="absolute top-10 left-10 w-[400px] h-[400px] rounded-full bg-brand/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-brand-2/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll">
          <Badge variant="brand" className="mb-4">Resume To Portfolio</Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            See the AI <br />
            <span className="gradient-text">Build Portfolios from CVs</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Drop in your resume, and our parser will automatically extract your contact details, draft summary sections, match color grids, and build a live portfolio site in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-12 items-stretch">

          {/* LEFT PANEL: CV Uploader Scanner & Parsing Steps */}
          <div className="flex flex-col justify-between space-y-8 animate-on-scroll">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" />
                <h3 className="text-xl font-bold">Try with Sample Resumes</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Click on any of the resume options below to simulate how the document parser reads fields from a PDF and converts it into a structured portfolio template.
              </p>

              {/* Resume selection items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sampleResumes.map((cv, idx) => (
                  <button
                    key={cv.fileName}
                    onClick={() => {
                      if (animState === "complete" || animState === "idle") {
                        setSelectedIdx(idx);
                      }
                    }}
                    disabled={animState !== "complete" && animState !== "idle"}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedIdx === idx
                      ? "border-brand bg-brand/5 shadow-glow"
                      : "border-border bg-secondary/20 hover:border-border-hover hover:bg-secondary/40"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className={`w-4 h-4 ${selectedIdx === idx ? "text-brand" : "text-muted-foreground"}`} />
                      <span className="text-[11px] font-mono truncate">{cv.fileName}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{cv.fileSize}</div>
                  </button>
                ))}
              </div>

              {/* CV Uploader & Scanner Visual Display */}
              <div className="rounded-2xl border border-border bg-secondary/10 p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[180px]">

                {/* scanning laser beam */}
                {animState === "scanning" && (
                  <motion.div
                    animate={{ y: [0, 140, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_10px_2px_var(--brand)] z-10"
                  />
                )}

                <AnimatePresence mode="wait">
                  {animState === "uploading" && (
                    <motion.div
                      key="uploading-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center"
                    >
                      <UploadCloud className="w-10 h-10 text-brand animate-bounce mb-3" />
                      <span className="text-xs font-semibold mb-2">Uploading: {activeCV.fileName}</span>
                      <div className="w-full max-w-xs h-1.5 rounded-full bg-border/40 overflow-hidden">
                        <motion.div
                          className="h-full gradient-bg"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {(animState === "scanning" || animState === "building") && (
                    <motion.div
                      key="scanning-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-4 w-full p-4 glass rounded-xl border border-brand/20 relative"
                    >
                      <div className="w-12 h-12 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{activeCV.fileName}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                          <span>{animState === "scanning" ? "Scanning layout structure..." : "Assembling elements..."}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {animState === "complete" && (
                    <motion.div
                      key="complete-state"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">Scan & Generation Complete!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Parsing Steps Logger */}
              <div className="h-[140px] rounded-2xl glass p-5 font-mono text-[11px] text-muted-foreground space-y-2 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-2">
                  <Terminal className="w-3.5 h-3.5 text-brand" />
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Parser execution logs</span>
                </div>
                {logs.map((log, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={log + index}
                    className="flex items-center gap-2 text-foreground/80"
                  >
                    <ChevronRight className="w-3 h-3 text-brand shrink-0" />
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Replay action */}
            <Button
              onClick={startGeneration}
              disabled={animState !== "complete"}
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${animState !== "complete" ? "animate-spin" : ""}`} />
              Regenerate Portfolio
            </Button>
          </div>

          {/* RIGHT PANEL: Live Browser Portfolio Mockup */}
          <div className="animate-on-scroll" style={{ transitionDelay: "150ms" }}>
            <GlassCard className="h-full p-2 rounded-3xl shadow-glow overflow-hidden flex flex-col min-h-[440px]">
              {/* Browser Header */}
              <div className="h-9 px-4 flex items-center gap-2 border-b border-border/60 bg-background/60">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-3 text-[10px] text-muted-foreground truncate">
                  {animState === "complete"
                    ? `portfoliobuilder.ai/u/${activeCV.parsedData.name.toLowerCase().replace(" ", "")}`
                    : "portfoliobuilder.ai/generator/preview"
                  }
                </div>
                {animState === "complete" && (
                  <Badge variant="success" className="ml-auto text-[9px] py-0 flex items-center gap-1 font-semibold">
                    <Eye className="w-2.5 h-2.5" /> Live
                  </Badge>
                )}
              </div>

              {/* Viewport Workspace */}
              <div className="flex-1 bg-secondary/10 p-6 flex flex-col justify-center relative overflow-hidden">
                <AnimatePresence mode="wait">

                  {/* Phase 1: Uploading/Scanning */}
                  {(animState === "uploading" || animState === "scanning") && (
                    <motion.div
                      key="idle-preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-brand/5 border border-brand/20 flex items-center justify-center mx-auto animate-pulse">
                        <Sparkles className="w-6 h-6 text-brand" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Building Sandbox Environment</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Awaiting resume data segments...</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Phase 2: Building & Complete */}
                  {(animState === "building" || animState === "complete") && (
                    <motion.div
                      key="portfolio-preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`w-full h-full flex flex-col space-y-4 text-left transition-colors duration-1000 p-5 rounded-xl ${activeCV.parsedData.theme}`}
                    >
                      {/* Nav element */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center justify-between border-b border-border/30 pb-2.5"
                      >
                        <span className="text-[9px] font-bold tracking-widest uppercase">
                          {activeCV.parsedData.name.split(" ")[0]}.dev
                        </span>
                        <div className="flex gap-2">
                          <span className="w-6 h-1.5 rounded-full bg-muted-foreground/30" />
                          <span className="w-6 h-1.5 rounded-full bg-muted-foreground/30" />
                        </div>
                      </motion.div>

                      {/* Info element */}
                      <div className="space-y-2 py-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "35%" }}
                          transition={{ duration: 0.6 }}
                          className={`h-1.5 rounded ${activeCV.parsedData.textColor} bg-current opacity-40`}
                        />
                        <motion.h4
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-base font-extrabold"
                        >
                          Hi, I'm <span className={activeCV.parsedData.textColor}>{activeCV.parsedData.name}</span>
                        </motion.h4>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-[10px] uppercase font-bold tracking-wider opacity-80"
                        >
                          {activeCV.parsedData.role}
                        </motion.div>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="text-[10px] text-muted-foreground leading-normal"
                        >
                          {activeCV.parsedData.about}
                        </motion.p>
                      </div>

                      {/* Modules element */}
                      <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">

                        {/* Projects column */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 }}
                          className="rounded-lg p-2.5 bg-secondary/30 border border-border/20 flex flex-col justify-between"
                        >
                          <div>
                            <div className="text-[7px] text-muted-foreground uppercase tracking-widest font-semibold">Featured Work</div>
                            <div className="space-y-1.5 mt-2">
                              {activeCV.parsedData.projects.map((proj) => (
                                <div key={proj} className="text-[9px] font-bold flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-brand" />
                                  {proj}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="h-1 rounded bg-brand/30 w-1/2" />
                        </motion.div>

                        {/* Skills column */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 }}
                          className="rounded-lg p-2.5 bg-secondary/30 border border-border/20 flex flex-col justify-between"
                        >
                          <div>
                            <div className="text-[7px] text-muted-foreground uppercase tracking-widest font-semibold">Skills Extracted</div>
                            <div className="flex gap-1 flex-wrap mt-2">
                              {activeCV.parsedData.skills.slice(0, 4).map((skill) => (
                                <span
                                  key={skill}
                                  className={`text-[7px] px-1.5 py-0.5 rounded border ${activeCV.parsedData.pillStyle}`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="h-1 rounded bg-brand-2/30 w-1/3" />
                        </motion.div>

                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </div>

        </div>

      </div>
    </section>
  );
}
