import {finishItem} from '../finishItem';

jest.mock('../../utils');
jest.mock('../../stats');
jest.mock('../../emails/TaskEmail');

describe('finishItem', () => {
	it('should let a user finish a project user item', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'USER',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est notre projeeet",
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		const item = await finishItem({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
		});
	});

	it('should let a customer finish a project customer item', async () => {
		const args = {
			id: 'item-id',
			token: 'customer-token',
		};
		const ctx = {
			request: {
				get: () => '',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'CUSTOMER',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		const item = await finishItem({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
		});
	});

	it('should not let a user finish a project customer item', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'CUSTOMER',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		await expect(finishItem({}, args, ctx)).rejects.toThrow(
			/cannot be finished by the user/,
		);
	});

	it('should not let a customer finish a project user item', async () => {
		const args = {
			id: 'item-id',
			token: 'customer-token',
		};
		const ctx = {
			request: {
				get: () => '',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'USER',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		await expect(finishItem({}, args, ctx)).rejects.toThrow(
			/cannot be finished by the customer/,
		);
	});
});