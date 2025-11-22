export interface Item {
  ITEM_ID: number;
  ITEM_NAME: string;
  SERIAL?: string;
  KIND?: string;
  SITUATION?: string;
  PROPERTIES?: string; // CLOB might be a string or a stream, handle accordingly
  HDD?: string;
  RAM?: string;
  IP?: string;
  COMP_NAME?: string;
  LOCK_NUM?: number;
  QUANTITY?: number;
  MIN_QUANTITY?: number;
  UNIT?: string;
  USER_ID?: number;
  ASSIGNED_USER?: string;
  DEPT_ID?: number;
  DEPT_NAME?: string;
  FLOOR_ID?: number;
  FLOOR_NAME?: string;
  SUB_CAT_ID?: number;
  SUB_CAT_NAME?: string;
  CAT_ID?: number;
  MAIN_CATEGORY_NAME?: string;
  ITEM_TYPE_ID?: number;
  ITEM_TYPE_NAME?: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface User {
  USER_ID: number;
  USERNAME: string;
  EMAIL: string;
  FULL_NAME: string;
  PHONE?: string;
  IS_ACTIVE: number;
  ROLE_NAME: string;
  DEPT_NAME?: string;
  RANK_NAME?: string;
  FLOOR_NAME?: string;
  // IDs for relationships (optional when returning joined results)
  ROLE_ID?: number;
  DEPT_ID?: number;
  RANK_ID?: number;
  FLOOR_ID?: number;
}

export interface MainCategory {
  CAT_ID: number;
  CAT_NAME: string;
  DESCRIPTION?: string;
}

export interface SubCategory extends MainCategory {
  SUB_CAT_ID: number;
  SUB_CAT_NAME: string;
  CAT_ID: number;
  DESCRIPTION?: string;

}

export interface ItemType extends SubCategory {
  ITEM_TYPE_ID: number;
  ITEM_TYPE_NAME: string;
  SUB_CAT_ID: number;

}

export interface Rank {
  RANK_ID: number;
  RANK_NAME: string;
}

export interface Floor {
  FLOOR_ID: number;
  FLOOR_NAME: string;
}
export interface Department {
  DEPT_ID: number;
  DEPT_NAME: string;
}

export interface MovementType {
  MOVEMENT_TYPE_ID: number;
  TYPE_NAME: string;
  TYPE_CODE: string;
  EFFECT: number;
  DESCRIPTION?: string;
  IS_ACTIVE?: number;
}

export interface InventoryMovement {
  MOVEMENT_ID: number;
  ITEM_ID: number;
  ITEM_NAME?: string;
  MOVEMENT_TYPE_ID: number;
  MOVEMENT_TYPE?: string;
  TYPE_CODE?: string;
  QUANTITY: number;
  PREVIOUS_QTY?: number;
  NEW_QTY?: number;
  MOVEMENT_DATE?: Date;
  USER_ID: number;
  USER_NAME?: string;
  USER_FULL_NAME?: string;
  FROM_DEPT_ID?: number;
  TO_DEPT_ID?: number;
  FROM_DEPT?: string;
  TO_DEPT?: string;
  FROM_FLOOR_ID?: number;
  TO_FLOOR_ID?: number;
  FROM_FLOOR?: string;
  TO_FLOOR?: string;
  REFERENCE_NO?: string;
  NOTES?: string;
  CREATED_AT: Date;
}