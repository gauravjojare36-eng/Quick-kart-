import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Sparkles, ShoppingBag, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I\'m your STAYRAW AI assistant. How can I help you find the perfect outfit today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isVipMode } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Fetch some context about products to help the AI
      const prefix = isVipMode ? 'vip_' : '';
      const productsSnap = await getDocs(collection(db, `${prefix}products`));
      const products = productsSnap.docs.slice(0, 10).map(doc => ({
        title: doc.data().title,
        price: doc.data().discountPrice || doc.data().price,
        category: doc.data().category
      }));

      const context = `You are a helpful shopping assistant for STAYRAW, an e-commerce store. 
      Current mode: ${isVipMode ? 'VIP Bulk Store (Minimum 10 items per product)' : 'Regular Store'}.
      Available products (sample): ${JSON.stringify(products)}.
      Be concise, friendly, and help users find what they need. If they ask about bulk, remind them about the VIP store.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: context }] },
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
      });

      const aiText = response.text || "I'm sorry, I couldn't process that. How else can I help?";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I\'m having some trouble connecting right now. Please try again later!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 p-4 rounded-full shadow-2xl z-50 transition-all transform hover:scale-110 ${
          isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-0 right-0 md:bottom-24 md:right-8 w-full md:w-96 h-[100dvh] md:h-[600px] bg-white md:rounded-3xl shadow-2xl z-[60] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between text-white ${
              isVipMode ? 'bg-purple-600' : 'bg-blue-600'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">STAYRAW AI</h3>
                  <p className="text-[10px] opacity-80">Always active to help you</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      m.role === 'user' ? 'bg-blue-100 text-blue-600 ml-2' : 'bg-purple-100 text-purple-600 mr-2'
                    }`}>
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about products, sizes, deals..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-2 p-2 rounded-lg transition-all ${
                    input.trim() && !isLoading 
                      ? (isVipMode ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white') 
                      : 'text-gray-300'
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-2">
                Powered by Gemini AI • STAYRAW Shopping Assistant
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
