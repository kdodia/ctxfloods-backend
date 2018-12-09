create table floods.camera (
  id               serial primary key,
  source           text not null,
  source_id        text not null,
  name             text not null check (char_length(name) < 180),
  geojson          text not null
);

comment on table floods.camera is 'A camera location on a map';
comment on column floods.camera.id is 'The primary unique identifier for the camera.';
comment on column floods.camera.source is 'Where the camera data is from (beholder or atd)';
comment on column floods.camera.source_id is 'Primary key of camera in original source';
comment on column floods.camera.name is 'Human-readable location name of the camera';
comment on column floods.camera.geojson is 'The GeoJSON coordinates of the camera.';

create table floods.camera_image (
  id               serial primary key,
  camera_id        integer not null references floods.camera(id),
  base64_image     text,
  uploaded_at      timestamp
);

comment on table floods.camera_image is 'An image taken by a camera';
comment on column floods.camera_image.id is 'The primary unique identifier for the image.';
comment on column floods.camera_image.camera_id is 'The id of the camera that took the image.';
comment on column floods.camera_image.base64_image is 'The base64 encoded image.';
comment on column floods.camera_image.uploaded_at is 'When image was taken (beholder) or loaded into ctxfloods (atd)';

create index on floods.camera_image (uploaded_at);
create index on floods.camera_image (camera_id);

grant select on table floods.camera to floods_anonymous;
grant all on table floods.camera to floods_super_admin;
grant select on table floods.camera_image to floods_anonymous;
grant all on table floods.camera_image to floods_super_admin;

create or replace function floods.add_camera_image (
  camera_id integer,
  base64_image text,
  uploaded_at timestamp default now()
) returns integer as $$
declare
  camera_image_id integer;
  input_camera_id integer := camera_id;
begin
  insert into floods.camera_image(camera_id, base64_image, uploaded_at)
    values (input_camera_id, base64_image, uploaded_at)
    returning id into camera_image_id;

  -- Only keep 5 most recent images for each camera
  delete from floods.camera_image
  where id in (
  	select id from
  	(
  		select id, row_number() over (order by ci.uploaded_at desc) as rn
  		from floods.camera_image ci
      where ci.camera_id = input_camera_id
  	) sq01 where rn > 5
  );

  return camera_image_id;
end;
$$ language plpgsql security definer;

comment on function floods.add_camera_image(integer, text, timestamp) is 'Adds an image for a camera and ensures that only a mamximum of 5 images remain stored.';
grant execute on function floods.add_camera_image(integer, text, timestamp) to floods_super_admin;
