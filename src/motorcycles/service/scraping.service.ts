/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MotorcycleImageScraperService {
  private readonly logger = new Logger(MotorcycleImageScraperService.name);

  /**
   * Método directo para motorbikemag.es
   */
  async searchMotorcycleImage(
    marca: string,
    modelo: string,
    anio?: number,
  ): Promise<{ url: string; source: string }> {
    try {
      // 1. Buscar directamente en la página de modelos
      const directSearch = await this.directSearchOnSite(marca, modelo);
      if (directSearch) {
        return directSearch;
      }

      // 2. Buscar con Google CSE
      const googleSearch = await this.searchWithGoogle(marca, modelo);
      if (googleSearch) {
        return googleSearch;
      }

      // 3. Fallback a Unsplash
      return this.getUnsplashImage(marca, modelo);
      
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return this.getUnsplashImage(marca, modelo);
    }
  }

  /**
   * Búsqueda directa en motorbikemag.es
   */
  private async directSearchOnSite(
    marca: string,
    modelo: string,
  ): Promise<{ url: string; source: string } | null> {
    try {
      // URL específica para marcas populares
      const brandSlugs: Record<string, string> = {
        'yamaha': 'yamaha',
        'honda': 'honda',
        'suzuki': 'suzuki',
        'kawasaki': 'kawasaki',
        'ktm': 'ktm',
        'bmw': 'bmw-motorrad',
        'ducati': 'ducati',
        'triumph': 'triumph',
        'harley': 'harley-davidson',
        'royal': 'royal-enfield',
      };

      const brandSlug = brandSlugs[marca.toLowerCase()] || marca.toLowerCase();
      const modelSlug = modelo.toLowerCase().replace(/\s+/g, '-');
      
      // Intentar varias URLs posibles
      const possibleUrls = [
        `https://www.motorbikemag.es/moto/${brandSlug}-${modelSlug}/`,
        `https://www.motorbikemag.es/ficha-tecnica/${brandSlug}-${modelSlug}/`,
        `https://www.motorbikemag.es/${brandSlug}/${modelSlug}/`,
        `https://www.motorbikemag.es/modelo/${brandSlug}/${modelSlug}/`,
      ];

      for (const url of possibleUrls) {
        try {
          const response = await axios.get(url, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; MotorcycleBot/1.0)',
            },
          });

          if (response.status === 200) {
            const $ = cheerio.load(response.data);
            
            // Buscar imagen Open Graph (la que usan para compartir)
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) {
              return {
                url: ogImage,
                source: 'motorbikemag.es (og)',
              };
            }

            // Buscar imagen principal
            const mainImage = $('.wp-post-image, .entry-thumbnail img, .featured-image img').first();
            const src = mainImage.attr('src');
            
            if (src) {
              return {
                url: src.startsWith('http') ? src : `https://www.motorbikemag.es${src}`,
                source: 'motorbikemag.es',
              };
            }
          }
        } catch (error) {
          continue; // Intentar siguiente URL
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Búsqueda con Google (más efectiva)
   */
  private async searchWithGoogle(
    marca: string,
    modelo: string,
  ): Promise<{ url: string; source: string } | null> {
    try {
      const query = `${marca} ${modelo} site:motorbikemag.es imagen ficha tecnica`.replace(/\s+/g, '+');
      const url = `https://www.google.com/search?q=${query}&tbm=isch`;
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      
      // Extraer todas las imágenes de los resultados
      const images: string[] = [];
      $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && src.startsWith('http') && 
            !src.includes('google.com') &&
            (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
          images.push(src);
        }
      });

      if (images.length > 0) {
        return {
          url: images[0],
          source: 'google_motorbikemag',
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Imagen de Unsplash (fallback de calidad)
   */
  private getUnsplashImage(
    marca: string,
    modelo: string,
  ): { url: string; source: string } {
    const type = this.getMotorcycleCategory(modelo);
    const queries: Record<string, string> = {
      'sport': 'sport+motorcycle+racing',
      'naked': 'naked+motorcycle+street',
      'adventure': 'adventure+motorcycle+offroad',
      'cruiser': 'cruiser+motorcycle+chopper',
      'scooter': 'scooter+urban',
      'default': 'motorcycle+bike',
    };

    const query = queries[type];
    return {
      url: `https://source.unsplash.com/featured/1200x800/?${query}`,
      source: 'unsplash_fallback',
    };
  }

  /**
   * Categoría de moto
   */
  private getMotorcycleCategory(modelo: string): string {
    const m = modelo.toLowerCase();
    
    if (m.includes('cbr') || m.includes('r1') || m.includes('r6') || 
        m.includes('gsx') || m.includes('ninja') || m.includes('panigale') ||
        m.includes('s1000')) return 'sport';
    
    if (m.includes('mt') || m.includes('z') || m.includes('duke') || 
        m.includes('monster') || m.includes('street')) return 'naked';
    
    if (m.includes('tenere') || m.includes('africa') || m.includes('v-strom') ||
        m.includes('versys') || m.includes('multistrada') || m.includes('gs') ||
        m.includes('adventure')) return 'adventure';
    
    if (m.includes('rebel') || m.includes('shadow') || m.includes('vulcan') ||
        m.includes('fat') || m.includes('harley') || m.includes('chopper')) return 'cruiser';
    
    if (m.includes('xmax') || m.includes('nmax') || m.includes('pcx') ||
        m.includes('burgman') || m.includes('vespa')) return 'scooter';
    
    return 'default';
  }

  /**
   * Descargar imagen
   */
  async downloadAndSaveImage(
    imageUrl: string,
    marca: string,
    modelo: string,
    placa: string,
  ): Promise<string | null> {
    try {
      // No descargar de Unsplash
      if (imageUrl.includes('unsplash.com') || imageUrl.includes('source.unsplash.com')) {
        return null;
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'motorcycles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${marca}_${modelo}.jpg`
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '_');
      
      const filePath = path.join(uploadDir, fileName);

      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 10000,
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(`/uploads/motorcycles/${fileName}`));
        writer.on('error', reject);
      });
    } catch (error) {
      this.logger.warn(`No se pudo descargar: ${error.message}`);
      return null;
    }
  }
}