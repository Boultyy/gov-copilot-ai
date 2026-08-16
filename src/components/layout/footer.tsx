import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">G</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">GovCopilot</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering citizens with AI-driven access to government services, 
              document intelligence, and real-time application tracking.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
              Official Digital India Initiative
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>support@govcopilot.in</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>+91 11 2345 6789</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Electronics Niketan, 6, CGO Complex, Lodhi Road, New Delhi - 110003</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition-colors hover:text-primary">
                  National Portal of India <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://digitalindia.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition-colors hover:text-primary">
                  Digital India <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://mygov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition-colors hover:text-primary">
                  MyGov Portal <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://meity.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition-colors hover:text-primary">
                  MeitY <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-muted-foreground">
            © {currentYear} GovCopilot. All rights reserved. Designed for Digital India.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
