import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const findCustomer = await this.customersRepository.findById(customer_id);

    if (!findCustomer) {
      throw new AppError('Customer does not exists.');
    }
    const products_ids = products.map(product => ({ id: product.id }));

    const findProducts = await this.productsRepository.findAllById(
      products_ids,
    );

    if (findProducts.length !== products.length) {
      throw new AppError('Products does not exists!');
    }

    const create_products = findProducts.map(product => {
      const product_alt = products.find(
        productAux => productAux.id === product.id,
      );
      return {
        product_id: product.id,
        price: product.price,
        quantity: product_alt?.quantity || 0,
      };
    });

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer: findCustomer,
      products: create_products,
    });

    return order;
  }
}

export default CreateOrderService;
