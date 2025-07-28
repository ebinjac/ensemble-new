import { Workspace } from "@/components/bluemailer/workspace";


export default function BluemailerLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Workspace>
                <main >{children}</main>
            </Workspace>
        </div>
    );
  }