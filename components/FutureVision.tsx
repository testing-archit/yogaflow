import React from 'react';

export const FutureVision: React.FC = () => {
  return (
    <section className="bg-teal-900 py-24 px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-8 leading-tight">
          More Than Just A Class.<br/>A Movement.
        </h2>
        <p className="text-teal-100 text-lg md:text-xl leading-relaxed mb-12">
          We are building a global community dedicated to sustainable health. 
          Your membership supports the development of future offline detox retreats 
          in Rishikesh and long-term lifestyle research.
        </p>
        <div className="inline-block border border-teal-700 bg-teal-800 rounded-lg p-6">
           <p className="text-teal-50 font-medium">
             "The goal isn't to be good at yoga. The goal is to be good at living."
           </p>
        </div>
      </div>
    </section>
  );
};