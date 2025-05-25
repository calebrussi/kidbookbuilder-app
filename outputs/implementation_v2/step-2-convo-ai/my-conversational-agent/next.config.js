/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_AGENT_ID: process.env.NEXT_PUBLIC_AGENT_ID
    }
};

module.exports = nextConfig; 