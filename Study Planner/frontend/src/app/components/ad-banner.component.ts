import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Advertisement } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-ad-banner',
  imports: [RouterLink],
  template: `
    @if (ads.length) {
      <aside class="ad-banner" aria-label="Espace partenaires">
        <p class="ad-banner__label">Partenaires</p>
        @for (ad of ads; track ad.id) {
          <article class="ad-card">
            <h3>{{ ad.title }}</h3>
            <p>{{ ad.description }}</p>
            @if (ad.linkUrl) {
              @if (ad.linkUrl.startsWith('/')) {
                <a [routerLink]="ad.linkUrl" class="link-arrow">En savoir plus</a>
              } @else {
                <a [href]="ad.linkUrl" target="_blank" rel="noopener" class="link-arrow">En savoir plus</a>
              }
            }
          </article>
        }
      </aside>
    }
  `
})
export class AdBannerComponent {
  @Input() ads: Advertisement[] = [];
}
