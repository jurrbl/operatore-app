import { Injectable, Renderer2, RendererFactory2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LoginEffectsService {
  private renderer: Renderer2;
  private isBrowser: boolean;
  private main: HTMLElement | null = null;
  private toggleButtons: NodeListOf<HTMLAnchorElement> | null = null;
  private inputs: NodeListOf<HTMLInputElement> | null = null;
  private bullets: NodeListOf<HTMLSpanElement> | null = null;
  private images: NodeListOf<HTMLImageElement> | null = null;

  constructor(rendererFactory: RendererFactory2, @Inject(PLATFORM_ID) private platformId: Object) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  applyLoginEffects(): void {
    if (!this.isBrowser) return; // Evita esecuzione lato server

    // Selezione degli elementi
    this.main = document.querySelector("main");
    this.toggleButtons = document.querySelectorAll<HTMLAnchorElement>(".toggle");
    this.inputs = document.querySelectorAll<HTMLInputElement>(".input-field");
    this.bullets = document.querySelectorAll<HTMLSpanElement>(".bullets span");
    this.images = document.querySelectorAll<HTMLImageElement>(".image");

    // Aggiunta effetti agli input
    this.inputs?.forEach((inp) => {
      inp.addEventListener("focus", () => inp.classList.add("active"));
      inp.addEventListener("blur", () => {
        if (inp.value === "") inp.classList.remove("active");
      });
    });

   

    // Cambio immagini con slider
    this.bullets?.forEach((bullet) => {
      bullet.addEventListener("click", () => this.moveSlider(bullet));
    });

    // Slide automatico ogni 3 secondi
    let currentIndex = 0;
    setInterval(() => {
      if (this.bullets) {
        currentIndex = (currentIndex + 1) % this.bullets.length;
        this.moveSlider(this.bullets[currentIndex]);
      }
    }, 3000);
  }

  private moveSlider(bullet: HTMLSpanElement): void {
    let index = bullet.dataset["value"];
    if (!index || !this.images) return;

    let currentImage = document.querySelector<HTMLImageElement>(`.img-${index}`);
    if (!currentImage) return;

    // Rimuove la classe "show" da tutte le immagini e aggiunge alla nuova
    this.images.forEach((img) => img.classList.remove("show"));
    currentImage.classList.add("show");

    // Sposta il testo del carosello
    const textSlider = document.querySelector<HTMLElement>(".text-group");
    if (textSlider) {
      textSlider.style.transform = `translateY(${-(Number(index) - 1) * 2.2}rem)`;
    }

    // Aggiorna i pallini del carosello
    this.bullets?.forEach((bull) => bull.classList.remove("active"));
    bullet.classList.add("active");
  }
}
