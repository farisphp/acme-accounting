'use strict';

const COMPANIES = [
  'One Direction',
  'Two Direction',
  'Secret Direction',
  'Off Direction',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'companies',
        COMPANIES.map((company) => ({
          name: company,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        { transaction: t },
      );

      const companies = await queryInterface.rawSelect(
        'companies',
        {
          where: {
            name: COMPANIES,
          },
          plain: false,
          transaction: t,
        },
        ['id', 'name'],
      );

      const users = companies.flatMap((company) => {
        const res = [
          {
            name: `John ${company.name}`,
            role: 'director',
            companyId: company.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            name: `Jane ${company.name}`,
            role: 'accountant',
            companyId: company.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        if (company.name === COMPANIES[1]) {
          res.push({
            name: `Ana ${company.name}`,
            role: 'director',
            companyId: company.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        if (company.name === COMPANIES[2]) {
          res.push({
            name: `Maria ${company.name}`,
            role: 'corporateSecretary',
            companyId: company.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        return res;
      });

      return await queryInterface.bulkInsert('users', users, {
        transaction: t,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('companies', null, {});
  },
};
