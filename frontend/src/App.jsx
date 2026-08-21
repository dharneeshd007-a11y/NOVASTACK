import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-red-600">EmergencyLink</span>
          </div>
          <nav>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer">
              Request Emergency
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Faster Coordination. Better Emergency Response.
          </h1>
          <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            NOVASTACK – EmergencyLink is a smart platform designed to streamline emergency response and hospital coordination, ensuring help arrives when it matters most.
          </p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-all transform hover:scale-105 cursor-pointer">
            Request Emergency Now
          </button>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} NOVASTACK – EmergencyLink. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
