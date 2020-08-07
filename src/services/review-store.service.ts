import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, Not } from 'typeorm';
import { ReviewStoreEntity } from '../entities';
import {
  RequestContext,
  EventBus,
  Order,
  UnauthorizedError,
  CustomerService,
  ListQueryBuilder
} from '@vendure/core';
import { ReviewService } from '../helpers';
import { ReviewStoreStateTransitionEvent } from '../events';

@Injectable()
export class ReviewStoreService extends ReviewService<
  ReviewStoreEntity,
  ReviewStoreStateTransitionEvent
> {
  constructor(
    @InjectConnection() connection: Connection,
    listQueryBuilder: ListQueryBuilder,
    customerService: CustomerService,
    eventBus: EventBus
  ) {
    super(
      connection,
      listQueryBuilder,
      customerService,
      eventBus,
      ReviewStoreEntity,
      ReviewStoreStateTransitionEvent
    );
  }

  async findCustomerReview(
    ctx: RequestContext
  ): Promise<ReviewStoreEntity | undefined> {
    const customer = await this.getCustomer(ctx);

    if (!customer) {
      throw new UnauthorizedError();
    }

    return await this.connection
      .getRepository(ReviewStoreEntity)
      .findOne({ customer: customer });
  }

  async getNPSAvg(): Promise<number> {
    const { nps } = await this.connection
      .getRepository(ReviewStoreEntity)
      .createQueryBuilder('review_store')
      .select('TRUNCATE(AVG(nps), 1)', 'nps')
      .where('state = :state', { state: 'Authorized' })
      .getRawOne();

    return nps;
  }

  /**
   * To create a review store the user must:
   *
   * - Be Logged
   * - Have an account
   * - Have at least one order placed
   */
  async checkIfCustomerIsValidToCreateReviewStore(
    ctx: RequestContext
  ): Promise<boolean> {
    const customer = await this.getCustomer(ctx);

    if (!customer) {
      return false;
    }

    const countOrders = await this.connection.getRepository(Order).count({
      where: {
        customer: customer,
        active: false,
        state: [Not('AddingItems'), Not('Cancelled'), Not('ArrangingPayment')]
      }
    });

    if (countOrders > 0) {
      return true;
    } else {
      return false;
    }
  }
}
