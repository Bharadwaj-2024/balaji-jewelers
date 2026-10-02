/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'a.1stdibscdn.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'di2ponv0v5otw.cloudfront.net' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'i.etsystatic.com' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'product-images.therealreal.com' },
      { protocol: 'https', hostname: 'queensdiamond.com' },
      { protocol: 'https', hostname: 'shop.southindiajewels.com' },
      { protocol: 'https', hostname: 'th.bing.com' },
      { protocol: 'https', hostname: 'www.bhindi.com' },
      { protocol: 'https', hostname: 'www.borsheims.com' },
      { protocol: 'https', hostname: 'www.chidambaramgoldcovering.com' },
      { protocol: 'https', hostname: 'www.engraversguild.co.uk' },
      { protocol: 'https', hostname: 'www.goldstardiamonds.ca' },
      { protocol: 'https', hostname: 'www.meenajewelers.com' },
      { protocol: 'https', hostname: 'www.southjewellery.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
