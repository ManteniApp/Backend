import { Injectable } from '@nestjs/common';

@Injectable()
export class MotorcycleSpecsRepository {
  findAll() {
    throw new Error('Method not implemented.');
  }
  findByMarcaAndModelo(marca: string, modelo: string) {
    throw new Error('Method not implemented.');
  }
  async create(data: any): Promise<any> {
    return data;
  }

  async findByMotorcycleId(motorcycleId: number): Promise<any> {
    return null;
  }

  async update(id: number, data: any): Promise<any> {
    return { id, ...data };
  }

  async delete(id: number): Promise<void> {
    return;
  }

  async findById(id: number): Promise<any> {
    return null;
  }

  async deleteByMotorcycleId(motorcycleId: number): Promise<void> {
    return;
  }
}