import { Query, Mutation, Args, Resolver } from '@nestjs/graphql';
import { ReviewStoreService } from '../../../services/review-store.service';
import {
  Permission,
  Ctx,
  RequestContext,
  Allow,
  IllegalOperationError
} from '@vendure/core';
import { ReviewStoreEntity } from '../../../entities/review-store.entity';
import { MutationCreateReviewStoreArgs } from './../../../types/generated-shop-schema';

@Resolver('ReviewStore')
export class ReviewStoreShopResolver {
  constructor(private reviewStoreService: ReviewStoreService) {}

  @Mutation()
  @Allow(Permission.Owner)
  async createReviewStore(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationCreateReviewStoreArgs
  ): Promise<ReviewStoreEntity> {
    if (
      !(await this.reviewStoreService.checkIfCustomerIsValidToCreateReviewStore(
        ctx
      ))
    ) {
      throw new IllegalOperationError('cannot-create-review-store');
    }
    return await this.reviewStoreService.create(args.input);
  }

  @Query()
  async avgReviewStore(): Promise<number> {
    return await this.reviewStoreService.getNPSAvg();
  }

  @Query()
  @Allow(Permission.Owner)
  async myReviewStore(
    @Ctx() ctx: RequestContext
  ): Promise<ReviewStoreEntity | undefined> {
    return await this.reviewStoreService.findCustomerReview(ctx);
  }
}
