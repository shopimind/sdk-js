export interface SpmCreateListData {
  name: string;
  type: 'list' | 'segment';
}

export interface SpmUpdateListData {
  name?: string;
  segmentation_config?: string;
  keep_updated?: boolean;
}
