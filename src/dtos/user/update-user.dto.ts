export interface UpdateUserDto {
  name: string;
  timezone: {
    value: string;
    offset: number;
  };
}
