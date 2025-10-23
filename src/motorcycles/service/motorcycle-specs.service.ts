/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { MotorcycleSpecsRepository } from '../repository/motorcycle-specs.repository';

@Injectable()
export class MotorcycleSpecsService {
  constructor(private readonly motorcycleSpecsRepo: MotorcycleSpecsRepository) {}

  async findAll() {
    return this.motorcycleSpecsRepo.findAll();
  }

  async create(data: {
    marca: string;
    modelo: string;
    cilindraje?: number;
    tipo?: string;
    potencia?: string;
    combustible?: string;
    transmision?: string;
    peso?: string;
  }) {
    return this.motorcycleSpecsRepo.create(data);
  }

  async deleteById(id: number) {
    return this.motorcycleSpecsRepo.deleteById(id);
  }
}
