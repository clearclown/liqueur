import { describe, it, expect } from "vitest";
import type {
  Dashboard,
  CreateDashboardInput,
  UpdateDashboardInput,
  DashboardListQuery,
} from "../../src/types/dashboard";
import type { LiquidViewSchema } from "@liqueur/protocol";

describe("Dashboard Types", () => {
  describe("Dashboard", () => {
    it("should accept valid Dashboard object", () => {
      const schema: LiquidViewSchema = {
        version: "1.0",
        components: [],
        data_sources: {},
      };

      const dashboard: Dashboard = {
        id: "dashboard-1",
        title: "Test Dashboard",
        description: "Test description",
        schema,
        createdAt: new Date(),
        updatedAt: new Date(),
        favorite: true,
      };

      expect(dashboard.id).toBe("dashboard-1");
      expect(dashboard.favorite).toBe(true);
    });

    it("should allow optional favorite field", () => {
      const schema: LiquidViewSchema = {
        version: "1.0",
        components: [],
        data_sources: {},
      };

      const dashboard: Dashboard = {
        id: "dashboard-2",
        title: "Test",
        schema,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(dashboard.favorite).toBeUndefined();
    });

    it("should inherit Artifact properties", () => {
      const schema: LiquidViewSchema = {
        version: "1.0",
        components: [],
        data_sources: {},
      };

      const dashboard: Dashboard = {
        id: "dashboard-3",
        title: "With Tags",
        schema,
        tags: ["tag1", "tag2"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(dashboard.tags).toEqual(["tag1", "tag2"]);
    });
  });

  describe("CreateDashboardInput", () => {
    it("should accept valid create input", () => {
      const schema: LiquidViewSchema = {
        version: "1.0",
        components: [],
        data_sources: {},
      };

      const input: CreateDashboardInput = {
        title: "New Dashboard",
        description: "Description",
        schema,
        tags: ["new"],
      };

      expect(input.title).toBe("New Dashboard");
      expect(input.schema.version).toBe("1.0");
    });

    it("should allow minimal create input", () => {
      const schema: LiquidViewSchema = {
        version: "1.0",
        components: [],
        data_sources: {},
      };

      const input: CreateDashboardInput = {
        title: "Minimal",
        schema,
      };

      expect(input.title).toBe("Minimal");
      expect(input.description).toBeUndefined();
      expect(input.tags).toBeUndefined();
    });
  });

  describe("UpdateDashboardInput", () => {
    it("should accept partial update", () => {
      const input: UpdateDashboardInput = {
        title: "Updated Title",
      };

      expect(input.title).toBe("Updated Title");
      expect(input.description).toBeUndefined();
    });

    it("should allow updating schema only", () => {
      const schema: LiquidViewSchema = {
        version: "1.0",
        components: [
          {
            type: "chart",
            variant: "bar",
          },
        ],
        data_sources: {},
      };

      const input: UpdateDashboardInput = {
        schema,
      };

      expect(input.schema?.components).toHaveLength(1);
      expect(input.title).toBeUndefined();
    });

    it("should allow updating all fields", () => {
      const schema: LiquidViewSchema = {
        version: "1.0",
        components: [],
        data_sources: {},
      };

      const input: UpdateDashboardInput = {
        title: "Updated",
        description: "New description",
        schema,
        tags: ["updated"],
      };

      expect(input.title).toBe("Updated");
      expect(input.description).toBe("New description");
      expect(input.tags).toEqual(["updated"]);
    });
  });

  describe("DashboardListQuery", () => {
    it("should accept full query parameters", () => {
      const query: DashboardListQuery = {
        search: "expenses",
        sort: "name",
        order: "asc",
        favorites: true,
        offset: 10,
        limit: 20,
      };

      expect(query.search).toBe("expenses");
      expect(query.sort).toBe("name");
      expect(query.order).toBe("asc");
      expect(query.favorites).toBe(true);
      expect(query.offset).toBe(10);
      expect(query.limit).toBe(20);
    });

    it("should allow empty query", () => {
      const query: DashboardListQuery = {};

      expect(query.search).toBeUndefined();
      expect(query.sort).toBeUndefined();
      expect(query.order).toBeUndefined();
      expect(query.favorites).toBeUndefined();
      expect(query.offset).toBeUndefined();
      expect(query.limit).toBeUndefined();
    });

    it("should enforce sort field type", () => {
      const validSorts: Array<DashboardListQuery["sort"]> = ["name", "created", "updated", undefined];

      validSorts.forEach((sort) => {
        const query: DashboardListQuery = { sort };
        expect(query.sort).toBe(sort);
      });
    });

    it("should enforce order type", () => {
      const validOrders: Array<DashboardListQuery["order"]> = ["asc", "desc", undefined];

      validOrders.forEach((order) => {
        const query: DashboardListQuery = { order };
        expect(query.order).toBe(order);
      });
    });

    it("should allow partial query with search only", () => {
      const query: DashboardListQuery = {
        search: "test",
      };

      expect(query.search).toBe("test");
    });

    it("should allow partial query with pagination only", () => {
      const query: DashboardListQuery = {
        offset: 0,
        limit: 50,
      };

      expect(query.offset).toBe(0);
      expect(query.limit).toBe(50);
    });
  });
});
