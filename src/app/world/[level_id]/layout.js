import "../../globals.css";

export const metadata = {
    title: "Create Next App",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
