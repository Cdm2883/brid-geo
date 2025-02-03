import "./globals.css";

export const metadata = {
    title: "BridGeo Ready...",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
