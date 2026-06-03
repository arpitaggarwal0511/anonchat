import React from 'react';

const Footer = ({ isDark = false }: { isDark?: boolean }) => {
  return (
    <footer
      id="footer"
      className={`mt-auto w-full border-t p-4 text-center text-sm ${
        isDark
          ? 'border-[#222e35] bg-[#111b21] text-[#8696a0]'
          : 'border-[#d1d7db] bg-[#f0f2f5] text-[#54656f]'
      }`}
    >
      <div className="container mx-auto max-w-6xl">
        Privacy settings hidden for your convenience. We are too broke to monetize your soul.
      </div>
    </footer>
  );
};

export default Footer;
