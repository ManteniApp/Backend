/* eslint-disable prettier/prettier */
import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Image Proxy')
@Controller('image-proxy')
export class ImageProxyController {
  @Get()
  @ApiOperation({ summary: 'Proxy para servir imágenes externas evitando CORS' })
  @ApiQuery({ name: 'url', required: true, description: 'URL de la imagen externa' })
  async proxyImage(@Query('url') imageUrl: string, @Res() res: Response) {
    if (!imageUrl) {
      throw new HttpException('URL parameter is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new HttpException(
          `Failed to fetch image: ${response.statusText}`,
          response.status,
        );
      }

      const contentType = response.headers.get('content-type');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Error fetching image: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
