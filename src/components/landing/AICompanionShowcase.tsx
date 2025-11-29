'use client';

import { motion } from 'framer-motion';
import { Sparkles, Brain, Shield, TrendingUp, MessageCircle, Heart, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Card3D } from './Card3D';
import { MagneticButton } from './MagneticButton';

// Animated chat bubble component
function ChatBubble({ message, delay = 0, isUser = false }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-2xl ${
          isUser
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-white/90 backdrop-blur-sm shadow-lg rounded-bl-none'
        }`}
      >
        <p className="text-sm">{message}</p>
      </div>
    </motion.div>
  );
}

// Floating particle for background
function FloatingParticle({ delay = 0, x = 0, y = 0 }: any) {
  return (
    <motion.div
      animate={{
        y: [y, y - 100, y],
        x: [x, x + 50, x - 30, x],
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="absolute w-2 h-2 rounded-full bg-primary/60"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );
}

export function AICompanionShowcase() {
  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden bg-gray-50">
      {/* Light gray background like "How It Works" */}
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.4} x={10 + (i * 6)} y={20 + (i * 4)} />
      ))}
      
      {/* Animated glow effects */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
      />

      <div className="container px-4 sm:px-6 md:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-primary to-accent text-white px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Support
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Meet Harthio AI - Your 24/7 Companion
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Never alone, even at 3 AM. Get instant support with evidence-based CBT tools, crisis detection, and personalized guidance.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
          {/* Animated Chat Preview */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Harthio AI</p>
                  <p className="text-xs text-gray-500">Always here for you</p>
                </div>
                <div className="ml-auto">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ChatBubble
                  delay={0.5}
                  message="I'm feeling overwhelmed with work stress today..."
                  isUser={true}
                />
                <ChatBubble
                  delay={1}
                  message="I hear you. Work stress can feel really heavy. Let's try a quick grounding exercise together. Can you name 5 things you can see right now?"
                />
                <ChatBubble
                  delay={1.5}
                  message="My desk, laptop, coffee mug, plant, and window"
                  isUser={true}
                />
                <ChatBubble
                  delay={2}
                  message="Great! You're doing well. This technique helps bring you back to the present moment. How are you feeling now?"
                />
              </div>

              {/* Typing indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="flex items-center gap-2 mt-4"
              >
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 rounded-full bg-gray-400"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 rounded-full bg-gray-400"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-500">AI is typing...</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <Card3D>
                <div className="glass-card p-4 sm:p-6 text-center h-full">
                  <motion.div
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Clock className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Always Available</h3>
                  <p className="text-xs sm:text-sm text-gray-600">24/7 support whenever you need it</p>
                </div>
              </Card3D>

              <Card3D>
                <div className="glass-card p-4 sm:p-6 text-center h-full">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Brain className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-accent" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">CBT Tools</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Evidence-based techniques</p>
                </div>
              </Card3D>

              <Card3D>
                <div className="glass-card p-4 sm:p-6 text-center h-full">
                  <motion.div
                    animate={{ rotate: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Shield className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-accent" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Crisis Detection</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Immediate help when needed</p>
                </div>
              </Card3D>

              <Card3D>
                <div className="glass-card p-4 sm:p-6 text-center h-full">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Track Progress</h3>
                  <p className="text-xs sm:text-sm text-gray-600">See your growth over time</p>
                </div>
              </Card3D>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <MagneticButton>
            <Button size="lg" className="shadow-xl hover:shadow-2xl" asChild>
              <Link href="/signup">
                <Sparkles className="mr-2 h-5 w-5" />
                Try AI Chat Free
              </Link>
            </Button>
          </MagneticButton>
          <p className="text-sm text-gray-500 mt-3">No credit card required • Free forever</p>
        </motion.div>
      </div>
    </section>
  );
}
