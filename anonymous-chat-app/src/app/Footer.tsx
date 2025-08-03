import React from 'react'

const Footer = () => {
  return (
    <footer id="footer" className="p-4 bg-gray-900 text-white text-center w-full mt-auto rounded-lg ">
      <div className="container mx-auto">
        <p className="text-sm">made by arpit aggarwal</p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="https://www.linkedin.com/in/arpit-aggarwal-5b6040257/" target="_blank" rel="noopener noreferrer">
            <img src="/linkedin.png" alt="LinkedIn" className="h-8 w-8 transition-transform transform hover:scale-110" />
          </a>
          <a href="https://github.com/arpitaggarwal0511" target="_blank" rel="noopener noreferrer">
            <img src="/github.png" alt="GitHub" className="h-8 w-8 transition-transform transform hover:scale-110" />
          </a>
          <a href="https://arpitaggarwal.netlify.app/" target="_blank" rel="noopener noreferrer">
            <img src="/web.png" alt="Portfolio" className="h-8 w-8 transition-transform transform hover:scale-110" />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
